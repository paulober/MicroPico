import {
  Disposable,
  Event,
  EventEmitter,
  FileChangeEvent,
  FileStat,
  FileSystemError,
  FileSystemProvider,
  FileType,
  Uri,
} from "vscode";
import { PyboardRunner, PyOutType } from "@paulober/pyboard-serial-com";
import type {
  PyOutGetItemStat,
  PyOutListContents,
  PyOutStatus,
} from "@paulober/pyboard-serial-com";
import Logger from "./logger.mjs";
import { v4 as uuidv4 } from "uuid";
import { basename, dirname, join } from "path";
import { tmpdir } from "os";
import { mkdir, readFile, rmdir, unlink, writeFile } from "fs/promises";
import { randomBytes } from "crypto";

const forbiddenFolders = [".vscode", ".git"];

export class PicoWFs implements FileSystemProvider {
  private logger: Logger;

  private cache: Map<string, any> = new Map();

  private pyb: PyboardRunner;
  private cacheEnabled: boolean = false;

  // FileSystemProvider stuff
  private _emitter = new EventEmitter<FileChangeEvent[]>();
  public onDidChangeFile: Event<FileChangeEvent[]> = this._emitter.event;

  constructor(pyboardRunner: PyboardRunner) {
    this.logger = new Logger("PicoWFs");
    this.pyb = pyboardRunner;
  }

  // TODO: add refresh button to filesystem view
  public async refreshCache(path: string = "/"): Promise<void> {
    // refresh cache
  }

  public watch(
    uri: Uri,
    options: {
      readonly recursive: boolean;
      readonly excludes: readonly string[];
    }
  ): Disposable {
    return new Disposable(() => {});
  }

  public async stat(uri: Uri): Promise<FileStat> {
    if (forbiddenFolders.some(folder => uri.path.includes(folder))) {
      this.logger.debug("stat: (inside) forbidden folder: " + uri.path);
      throw FileSystemError.FileNotFound(uri);
    }

    const result = await this.pyb.getItemStat(uri.path);

    if (result.type !== PyOutType.getItemStat) {
      this.logger.error("stat: unexpected result type");
      throw FileSystemError.Unavailable(uri);
    }

    const itemStat = (result as PyOutGetItemStat).stat;

    if (
      itemStat === null ||
      itemStat.created === undefined ||
      itemStat.lastModified === undefined
    ) {
      this.logger.warn("stat: item not found: " + uri.path);
      throw FileSystemError.FileNotFound(uri);
    }

    return {
      type: itemStat.isDir ? FileType.Directory : FileType.File,
      ctime: itemStat.created.getTime(),
      mtime: itemStat.lastModified.getTime(),
      size: itemStat.size,
    };
  }

  public async readDirectory(uri: Uri): Promise<[string, FileType][]> {
    const result = await this.pyb.listContents(uri.path);

    if (result.type === PyOutType.none) {
      this.logger.error("readDirectory: Directory propably not found");
      throw FileSystemError.FileNotFound(uri);
    } else if (result.type !== PyOutType.listContents) {
      this.logger.error("readDirectory: unexpected result type");
      throw FileSystemError.Unavailable(uri);
    }

    const items = (result as PyOutListContents).response;

    return items.map(item => [
      item.path,
      item.isDir ? FileType.Directory : FileType.File,
    ]);
  }

  public async createDirectory(uri: Uri): Promise<void> {
    if (forbiddenFolders.includes(basename(uri.path))) {
      this.logger.debug("createDirectory: forbidden folder");
      throw FileSystemError.NoPermissions(uri);
    }

    const result = await this.pyb.createFolders([uri.path]);
    if (result.type === PyOutType.status) {
      const status = (result as PyOutStatus).status;
      if (!status) {
        this.logger.warn("createDirectory: propably already existsed");
        throw FileSystemError.FileExists(uri);
      }
      return;
    }

    this.logger.error("createDirectory: unexpected result type");
    throw FileSystemError.Unavailable(uri);
  }

  public async readFile(uri: Uri): Promise<Uint8Array> {
    if (forbiddenFolders.some(folder => uri.path.includes(folder))) {
      this.logger.debug("readFile: file in forbidden folder");
      throw FileSystemError.FileNotFound(uri);
    }

    // create path to temporary file
    const tmpFilePath = join(tmpdir(), uuidv4({ random: _v4Bytes() }) + ".tmp");
    const result = await this.pyb.downloadFiles([uri.path], tmpFilePath);

    if (result.type === PyOutType.status) {
      const status = (result as PyOutStatus).status;
      if (!status) {
        this.logger.error("readFile: unexpected result type");
        throw FileSystemError.FileNotFound(uri);
      } else {
        const content: Uint8Array = new Uint8Array(await readFile(tmpFilePath));
        // delete tmpFilePath
        await unlink(tmpFilePath);

        return content;
      }
    }

    this.logger.error("readFile: unexpected result type");
    throw FileSystemError.FileNotFound(uri);
  }

  public async writeFile(
    uri: Uri,
    content: Uint8Array,
    options: { readonly create: boolean; readonly overwrite: boolean }
  ): Promise<void> {
    if (forbiddenFolders.some(folder => uri.path.includes(folder))) {
      this.logger.error("writeFile: file destination in forbidden folder");
      throw FileSystemError.FileNotFound(uri);
    }

    const tempDir = join(tmpdir(), uuidv4({ random: _v4Bytes() }));
    await mkdir(tempDir);

    const tmpFilePath = join(tempDir, basename(uri.path));
    // write
    await writeFile(tmpFilePath, content);

    // upload
    const result = await this.pyb.uploadFiles(
      [tmpFilePath],
      // trailing slash needed so uploader knows what is a destination FOLDER
      dirname(uri.path) + "/"
    );
    if (result.type === PyOutType.status) {
      const status = (result as PyOutStatus).status;
      if (!status) {
        this.logger.warn("writeFile: failed to upload file");
        throw FileSystemError.FileExists(uri);
      }
    }

    // clean-up temp
    await unlink(tmpFilePath);
    await rmdir(tempDir);
  }

  public async delete(
    uri: Uri,
    options: { readonly recursive: boolean }
  ): Promise<void> {
    if (options.recursive) {
      const result = await this.pyb.deleteFolderRecursive(uri.path);
      if (result.type === PyOutType.status) {
        const status = (result as PyOutStatus).status;
        if (!status) {
          throw FileSystemError.FileNotFound(uri);
        }
      }
    } else {
      // assume it is a file
      let result = await this.pyb.deleteFiles([uri.path]);
      if (result.type === PyOutType.status) {
        let status = (result as PyOutStatus).status;
        if (!status) {
          // assumption seems to be wrong, try to delete as folder
          result = await this.pyb.deleteFolders([uri.path]);
          if (result.type === PyOutType.status) {
            status = (result as PyOutStatus).status;
            if (!status) {
              // both failed, so most likely the fs item does not exist
              throw FileSystemError.FileNotFound(uri);
            }
          }
        }
      }
    }
  }

  public async rename(
    oldUri: Uri,
    newUri: Uri,
    // does always overwrite
    options: { readonly overwrite: boolean }
  ): Promise<void> {
    const result = await this.pyb.renameItem(oldUri.path, newUri.path);

    if (result.type === PyOutType.status) {
      const status = (result as PyOutStatus).status;
      if (!status) {
        throw FileSystemError.FileExists(newUri);
      }
    }

    this.logger.error("rename: unexpected result type");
    throw FileSystemError.Unavailable(oldUri);
  }

  // TODO: implement
  public async copy?(
    source: Uri,
    destination: Uri,
    options: { readonly overwrite: boolean }
  ): Promise<void> {}
}

/**
 * Generate random bytes for uuidv4 as crypto.getRandomValues is not supported in vscode extensions
 *
 * @returns 16 random bytes
 */
function _v4Bytes(): Uint8Array {
  return new Uint8Array(randomBytes(16).buffer);
}

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
  PyOutListContents,
  PyOutFsOps,
} from "@paulober/pyboard-serial-com";
import Logger from "./logger.mjs";
import { v4 as uuidv4 } from "uuid";
import { basename, dirname, join } from "path";
import { tmpdir } from "os";
import { mkdir, readFile, rmdir, unlink, writeFile } from "fs/promises";

export class PicoWFs implements FileSystemProvider {
  private logger: Logger;

  private cache: Map<string, any> = new Map();

  private pyb: PyboardRunner;
  private cacheEnabled: boolean = true;

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

  watch(
    uri: Uri,
    options: {
      readonly recursive: boolean;
      readonly excludes: readonly string[];
    }
  ): Disposable {
    throw new Error("Method not implemented.");
  }

  // TODO: implement
  public stat(uri: Uri): FileStat | Thenable<FileStat> {
    throw new Error("Method not implemented.");
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
    const result = await this.pyb.createFolders([uri.path]);
    if (result.type === PyOutType.fsOps) {
      const status = (result as PyOutFsOps).status;
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
    // create path to temporary file
    const tmpFilePath = join(tmpdir(), uuidv4() + ".tmp");
    const result = await this.pyb.downloadFiles([uri.path], tmpFilePath);

    if (result.type === PyOutType.fsOps) {
      const status = (result as PyOutFsOps).status;
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
    const tempDir = join(tmpdir(), uuidv4());
    await mkdir(tempDir);

    const tmpFilePath = join(tempDir, basename(uri.fsPath));
    // write
    await writeFile(tmpFilePath, content);

    // upload
    await this.pyb.uploadFiles([tmpFilePath], dirname(uri.fsPath));

    // clean-up temp
    unlink(tmpFilePath);
    rmdir(tempDir);
  }

  public async delete(
    uri: Uri,
    options: { readonly recursive: boolean }
  ): Promise<void> {
    if (options.recursive) {
      const result = await this.pyb.deleteFolderRecursive(uri.path);
      if (result.type === PyOutType.fsOps) {
        const status = (result as PyOutFsOps).status;
        if (!status) {
          throw FileSystemError.FileNotFound(uri);
        }
      }
    } else {
      // assume it is a file
      let result = await this.pyb.deleteFiles([uri.path]);
      if (result.type === PyOutType.fsOps) {
        let status = (result as PyOutFsOps).status;
        if (!status) {
          // assumption seems to be wrong, try to delete as folder
          result = await this.pyb.deleteFolders([uri.path]);
          if (result.type === PyOutType.fsOps) {
            status = (result as PyOutFsOps).status;
            if (!status) {
              // both failed, so most likely the fs item does not exist
              throw FileSystemError.FileNotFound(uri);
            }
          }
        }
      }
    }
  }

  // TODO: implement
  public async rename(
    oldUri: Uri,
    newUri: Uri,
    options: { readonly overwrite: boolean }
  ): Promise<void> {}

  // TODO: implement
  public async copy?(
    source: Uri,
    destination: Uri,
    options: { readonly overwrite: boolean }
  ): Promise<void> {}
}

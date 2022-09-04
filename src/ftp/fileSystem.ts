// Marshals FTP access to the Pico W board, ensuring that
// only a single command is carried out at once, even though
// there might be multiple FTP connections concurrently.

import Shell from '../rp2/shell';
import * as _ from 'lodash';
import * as path from 'path';
import * as uuid from 'uuid';
import { Readable } from 'stream';
// enabled esModuleInterop in tsconfig just for this module :|
import MemoryStream from 'memorystream';
import FileWriter from '../rp2/fileWriter';
import { Mutex } from 'async-mutex';
import { FileSystemError } from 'ftp-srv';
import Pyboard from '../rp2/pyboard';
import SettingsWrapper from '../settingsWrapper';
import Term from '../terminal';

const mutex = new Mutex();
const logEnabled = false;

export default class FtpFileSystem {
  public terminal: Term;
  private shellEntered: boolean;
  private shell: Shell;
  private board: Pyboard;
  private settings: SettingsWrapper;
  private _list?: Array<{
    [key: string]: string | number | (() => boolean);
  }>;

  constructor(board: Pyboard, settings: SettingsWrapper, terminal: Term) {
    this.board = board;
    this.settings = settings;
    this.terminal = terminal;
    this.shell = new Shell(board, settings);
    this.shellEntered = false;
  }

  private async ensureListing(force = false) {
    if (!this.shellEntered) {
      await this.shell.initialise();
      this.shellEntered = true;
    }

    if (!this._list || force) {
      await this.refreshListing();
    }
  }

  private async refreshListing(useExistingMutex = false) {
    let _this = this;
    let action = async () => {
      _this._list = await _this.shell.list('/', true, false);
      _this._list?.push({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Fullname: '/',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Size: 0,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Path: '',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Name: '/',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Type: 'dir',
      });
    };

    if (useExistingMutex) {
      await action();
    } else {
      await mutex.runExclusive(action);
    }
  }

  private resolvePath(cwd: string, newPath: string): string {
    if (newPath === '.' || newPath === '-la') {
      return cwd;
    }

    if (newPath.endsWith('/-la')) {
      // Keep trailing slash
      newPath = newPath.substring(0, newPath.length - 3);
    }

    let result = (
      path.isAbsolute(newPath)
        ? path.normalize(newPath)
        : path.join('/', cwd, newPath)
    ).replaceAll('\\', '/');

    return result;
  }

  public get root() {
    return '/';
  }

  public async get(cwd: string, fileName: string) {
    // While this doesn't do anything with the board, the board's
    // operations have to be complete for the listing data to be reliable.
    let _this = this;

    await _this.ensureListing();

    return await mutex.runExclusive(async () => {
      fileName = _this.resolvePath(cwd, fileName);

      // TODO: could cause problems because return type is "undefined"
      let item: any = _.find(_this._list, (x: any) => x.Fullname === fileName);

      if (item === null) {
        throw new FileSystemError(`'${fileName}' does not exist!`);
      }

      return {
        // 16895 is a directory with 0777; 511 is a file with 0777.
        name: item.Name,
        mode: item.Type === 'dir' ? 16895 : 511,
        size: item.Size,
        mtime: Date.now(),
        isDirectory: () => item.Type === 'dir',
      };
    });
  }

  public async list(
    cwd: string,
    folderPath: string = '.'
  ): Promise<
    Array<{
      name: string;
      mode: number;
      size: number;
      mtime: number;
      isDirectory: () => boolean;
    }>
  > {
    folderPath = this.resolvePath(cwd, folderPath);
    this.log(`Listing: ${folderPath}`);

    // This call will block, so the remainder is safe.
    await this.ensureListing(true);

    let items = _.filter(this._list, (x: any) => x.Path === folderPath);

    return _.map(items, (x: any) => ({
      name: x.Name,
      mode: x.Type === 'dir' ? 16895 : 511,
      size: x.Size,
      mtime: Date.now(),
      isDirectory: () => x.Type === 'dir',
    }));
  }

  async chdir(cwd: string, folderPath: string = '.') {
    // While this doesn't do anything with the board, the board's
    // operations have to be complete for the listing data to be reliable.
    let _this = this;
    return await mutex.runExclusive(async () => {
      folderPath = _this.resolvePath(cwd, folderPath);

      this.log(`Changing directory to: ${folderPath}`);

      let item: any = _.find(
        _this._list,
        (x: any) => x.Fullname === folderPath
      );

      if (item === null) {
        throw new FileSystemError(`'${folderPath}' doesn't exist.`);
      }

      if (item.Type !== 'dir') {
        throw new FileSystemError(`'${folderPath}' is a file, not a folder.`);
      }

      return folderPath;
    });
  }

  async write(
    cwd: string,
    fileName: string,
    { append = false, start = 0 } = {}
  ) {
    let release = await mutex.acquire();
    let stream = new MemoryStream();
    let data = Buffer.alloc(0);
    let _this = this;
    let written = false;

    fileName = this.resolvePath(cwd, fileName);

    this.log(`Writing '${fileName}'`);

    stream.on('data', function (chunk: any) {
      data = Buffer.concat([data, chunk]);
    });

    stream.on('end', async function () {
      if (written) {
        return;
      }
      written = true;

      try {

        _this.log('Ended: ' + data.length + ' bytes');
        let writer = new FileWriter(_this.shell, _this.board, _this.settings);
        await writer.writeFileContent(fileName, fileName, data, 0);
      } catch (err: any) {

        if (typeof err === 'string') {
          _this.terminal.write(err);
        } else {
          _this.terminal.write(err.message.toString());
        }
      } finally {

        await _this.refreshListing(true);
        release();
        _this.log('All done!');
      }
    });

    stream.once('close', () => stream.end());

    stream.on('error', () => {
      _this.log('Error has occurred');
      release();
    });

    if (append) {
      await this.ensureListing();
      fileName = this.resolvePath(cwd, fileName);

      // TODO: could cause problems because return type is "undefined"
      let item: any = _.find(this._list, (x: any) => x.Fullname === fileName);

      if (item.Type === 'dir') {
        throw new FileSystemError('Cannot read a directory');
      }

      let result = await this.shell.readFile(fileName);
      stream.write(result.buffer.subarray(0, start));
    }

    return {
      stream,
      fileName,
    };
  }

  async read(cwd: string, fileName: string, { start = 0 } = {}) {
    await this.ensureListing();

    let _this = this;

    return await mutex.runExclusive(async () => {
      fileName = _this.resolvePath(cwd, fileName);
      this.log(`Reading '${fileName}'`);

      let item: any = _.find(_this._list, (x: any) => x.Fullname === fileName);

      if (item === null) {
        throw new FileSystemError(`'${fileName}' does not exist!`);
      }

      if (item.Type === 'dir') {
        throw new FileSystemError('Cannot read a directory');
      }

      let result = await _this.shell.readFile(fileName);
      let stream = new Readable();
      stream.push(result.buffer.slice(start));
      stream.push(null);

      return { stream, fileName };
    });
  }

  async delete(cwd: string, fileOrFolderPath: string) {
    await this.ensureListing();

    let _this = this;

    await mutex.runExclusive(async () => {
      fileOrFolderPath = _this.resolvePath(cwd, fileOrFolderPath);
      this.log(`Deleting '${fileOrFolderPath}'`);

      // TODO: could cause problems because return type is "undefined"
      let item: any = _.find(
        _this._list,
        (x: any) => x.Fullname === fileOrFolderPath
      );

      if (item === null) {
        throw new FileSystemError(`'${fileOrFolderPath}' does not exist!`);
      }

      if (item.Type === 'dir') {
        await _this.shell.removeDir(fileOrFolderPath);
      } else {
        await _this.shell.removeFile(fileOrFolderPath);
      }

      await _this.refreshListing(true);
    });
  }

  async mkdir(cwd: string, folderPath: string) {
    let _this = this;

    folderPath = _this.resolvePath(cwd, folderPath);

    await mutex.runExclusive(async () => {
      this.log(`Making Directory '${folderPath}'`);
      await _this.shell.createDir(folderPath);
      await this.refreshListing(true);
    });
  }

  async rename(cwd: string, from: string, to: string) {
    let _this = this;

    await mutex.runExclusive(async () => {
      from = _this.resolvePath(cwd, from);
      to = _this.resolvePath(cwd, to);

      this.log(`Renaming from '${from}' to '${to}'`);

      let item = _.find(_this._list, (x: any) => x.Fullname === from);

      if (item === null) {
        throw new FileSystemError(`'${from}' does not exist!`);
      }

      await _this.shell.renameFile(from, to);
      await _this.refreshListing(true);
    });
  }

  // eslint-disable-next-line no-unused-vars
  public chmod(cwd: string, fileOrFolderPath: string, mode: any) {
    throw new Error("chmod isn't supported!");
  }

  public getUniqueName() {
    return uuid.v4().replace(/\W/g, '');
  }

  public async close() {
    if (mutex.isLocked()) {
      mutex.cancel();
    }

    this.shell.close();
  }

  private log(message: string) {
    if (logEnabled) {
      this.terminal.writeln(message);
    }
  }
}

import Shell from '../board/shell.js';
import _ from 'lodash';
import path from 'path';
import uuid from 'uuid';
import { Readable } from 'stream';
import MemoryStream from 'memorystream';
import FileWriter from '../board/file-writer.js';
import {Mutex} from 'async-mutex';
import { list } from 'serialport';

const mutex = new Mutex();

export default class FtpFileSystem {
  constructor(board, settings, terminal) {
    this._board = board;
    this._settings = settings;
    this._terminal = terminal;
    this._shell = new Shell(board, settings);
    this._cwd = '/';
    this._shellEntered = false;
  }

  async _ensureListing() {
    if (!this._shellEntered) {
      await this._shell.initialise();
      this._shellEntered = true;
    }

    if (!this._list)
      await this._refreshListing();
  }

  async _refreshListing() {
    let _this = this;

    await mutex.runExclusive(async () => {
      _this._list = await _this._shell.list('/', true, false);
      _this._list.push({
        Fullname: '/',
        Size: 0,
        Path: '',
        Name: '/',
        Type: 'dir'
      });
    });
  }

  _resolvePath(newPath) {
    if (newPath == '.')
      return this._cwd;

    return path.isAbsolute(newPath) ?
      path.normalize(newPath) :
      path.join('/', this._cwd, newPath).replace('\\', '/');
  }

  get root() {
    return '/';
  }

  currentDirectory() {
    return this._cwd;
  }

  async get(fileName) {
    await this._ensureListing();
    fileName = this._resolvePath(fileName);

    let item = _.find(this._list, x => x.Fullname == fileName);

    if (item == null)
      return null;

    return {
      // 16895 is a directory with 0777; 511 is a file with 0777. 
      name: item.Name,
      mode: item.Type == 'dir' ? 16895 : 511,
      size: item.Size,
      mtime: Date.now(),
      isDirectory: () => item.Type == 'dir'
    };
  }

  async list(folderPath = '.') {
    await this._refreshListing();
    folderPath = this._resolvePath(folderPath);

    let items = _.filter(this._list, x => x.Path == folderPath);

    return _.map(items, x => ({
      name: x.Name,
      mode: x.Type == 'dir' ? 16895 : 511,
      size: x.Size,
      mtime: Date.now(),
      isDirectory: () => x.Type == 'dir'
    }));
  }

  async chdir(folderPath = '.') {
    this._cwd = this._resolvePath(folderPath);
  }

  async write(fileName, { append = false, start = 0 } = {}) {
    let release = await mutex.acquire();
    let stream = new MemoryStream();
    let data = Buffer.alloc(0);
    let _this = this;

    stream.on('data', function(chunk) {
      data = Buffer.concat([data, chunk]);
    });

    stream.on('end', async function() {
      try {
        let writer = new FileWriter(_this._shell, _this._board, _this
          ._settings, null);
        await writer.writeFileContent(fileName, fileName, data, 0);
      }
      finally {
        release();
        await list();
      }
    });

    if (append) {
      await this._ensureListing();
      fileName = this._resolvePath(fileName);

      let item = _.find(this._list, x => x.Fullname == fileName);

      if (item.Type == 'dir') {
        throw new Error('Cannot read a directory');
      }

      let result = await this._shell.readFile(fileName);
      stream.write(result.buffer.slice(0, start));
    }

    return {
      stream,
      fileName
    };
  }

  async read(fileName, { start = 0 } = {}) {
    await this._ensureListing();

    let _this = this;

    return await mutex.runExclusive(async () => {
      fileName = _this._resolvePath(fileName);

      let item = _.find(_this._list, x => x.Fullname == fileName);
  
      if (item.Type == 'dir') {
        throw new Error('Cannot read a directory');
      }
  
      let result = await _this._shell.readFile(fileName);
      let stream = new Readable();
      stream.push(result.buffer.slice(start));
      stream.push(null);
  
      return { stream, fileName };
    });
  }

  async delete(fileOrFolderPath) {
    await this._ensureListing();

    let _this = this;

    await mutex.runExclusive(async () => {
      fileOrFolderPath = _this._resolvePath(fileOrFolderPath);

      let item = _.find(_this._list, x => x.Fullname == fileOrFolderPath);
  
      if (item.Type == 'dir') {
        await _this._shell.removeDir(fileOrFolderPath);
      }
      else {
        await _this._shell.removeFile(fileOrFolderPath);
      }
    });
  }

  async mkdir(folderPath) {
    let _this = this;
    
    await mutex.runExclusive(async () => {
      await _this._shell.createDir(folderPath);
    });

    await this.list();
  }

  async rename(from, to) {
    let _this = this;

    await mutex.runExclusive(async () => {
      await _this._shell.renameFile(from, to);
    });
  }

  // eslint-disable-next-line no-unused-vars
  chmod(fileOrFolderPath, mode) {
    throw new Error('chmod isn\'t supported!');
  }

  getUniqueName() {
    return uuid.v4().replace(/\W/g, '');
  }

  async close() {
    this._shell.close();
  }
}
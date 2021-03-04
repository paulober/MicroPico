'use babel';

import * as fs from 'fs';
import { promises as fsp } from 'fs';
import * as crypto from 'crypto';
import Logger from '../helpers/logger.js';
import Utils from '../helpers/utils.js';

export default class ProjectStatus {

  constructor(shell, settings, local_folder) {
    this.shell = shell;
    this.logger = new Logger('ProjectStatus');
    this.utils = new Utils(settings);
    this.localFolder = local_folder;
    this.settings = settings;
    this.allowedFileTypes = this.settings.getAllowedFileTypes();
    this.content = [];
    this.boardFileHashes = {};
    this.changed = false;

    let _this = this;
    this._getLocalFilesHashed()
      .then(hashes => _this.localFileHashes = hashes);
  }

  async read() {
    let result = await this.shell.readFile('project.pico-go');

    let json = [];

    if (result.str != '') {
      json = JSON.parse(result.str);
    }
    this.content = json;
    this._processFile();

    return json;
  }

  async write() {
    try {
      if (this.changed) {
        this.logger.info('Writing project status file to board');
        let boardHashArray = Object.values(this.boardFileHashes);
        let projectFileContent = Buffer.from(JSON.stringify(
          boardHashArray));
        await this.shell.writeFile('project.pico-go', null,
          projectFileContent);
      }
      else {
        this.logger.info('No changes to file, not writing');
      }
    }
    catch (err) {
      this.changed = false;
      throw err;
    }
  }

  update(name) {
    this.changed = true;
    if (!this.localFileHashes[name]) {
      delete this.boardFileHashes[name];
    }
    else {
      this.boardFileHashes[name] = this.localFileHashes[name];
    }
  }

  _processFile() {
    for (let i = 0; i < this.content.length; i++) {
      let h = this.content[i];
      this.boardFileHashes[h[0]] = h;
    }
  }

  _get_local_files(dir) {
    return fs.readdirSync(dir);
  }

  async _getLocalFiles(dir) {
    return await fsp.readdir(dir);
  }

  async _getLocalFilesHashed(files, path) {
    if (!files) {
      try {
        files = await this._getLocalFiles(this.localFolder);
      }
      catch (e) {
        this.logger.error("Couldn't locate file folder");
        return false;
      }
    }
    if (!path) {
      path = '';
    }
    let fileHashes = {};

    files = this.utils.ignoreFilter(files);

    for (let i = 0; i < files.length; i++) {
      let filename = path + files[i];
      if (filename.length > 0 && filename.substring(0, 1) != '.') {
        let filePath = this.localFolder + filename;
        let stats = await fsp.lstat(filePath);
        let isDir = stats.isDirectory();
        if (stats.isSymbolicLink()) {
          isDir = filename.indexOf('.') == -1;
        }
        if (isDir) {
          try {
            let filesFromFolder = await this._getLocalFiles(filePath);
            if (filesFromFolder.length > 0) {
              let hash = crypto.createHash('sha256').update(filename).digest(
                'hex');
              fileHashes[filename] = [filename, 'd', hash];
              let hashes_in_folder = await this._getLocalFilesHashed(
                filesFromFolder, filename + '/');
              fileHashes = Object.assign(fileHashes, hashes_in_folder);
            }
          }
          catch (e) {
            this.logger.info('Unable to read from dir ' + filePath);
            console.log(e);
          }
        }
        else {
          let contents = await fsp.readFile(filePath);
          let hash = crypto.createHash('sha256').update(contents).digest(
            'hex');
          fileHashes[filename] = [filename, 'f', hash, stats.size];
        }
      }
    }
    return fileHashes;
  }

  async prepareFile(pyFolder, filePath) {
    let contents = await fsp.readFile(filePath);
    let stats = await fsp.lstat(filePath);
    let hash = crypto.createHash('sha256').update(contents).digest('hex');
    let filename = filePath.replace(pyFolder, '').replace('\\', '/');
    return [filename, 'f', hash, stats.size];
  }

  getChanges() {
    let changedFiles = [];
    let changedFolders = [];
    let deletes = [];
    let boardHashes = Object.assign({}, this.boardFileHashes);
    let localHashes = Object.assign({}, this.localFileHashes);

    // all local files
    for (let name in localHashes) {
      let localHash = this.localFileHashes[name];
      let boardHash = boardHashes[name];

      if (boardHash) {
        // check if hash is the same
        if (localHash[2] != boardHash[2]) {

          if (localHash[1] == 'f') {
            changedFiles.push(localHash);
          }
          else {
            changedFolders.push(localHash);
          }
        }
        delete boardHashes[name];

      }
      else {
        if (localHash[1] == 'f') {
          changedFiles.push(localHash);
        }
        else {
          changedFolders.push(localHash);
        }
      }
    }
    for (let name in boardHashes) {
      if (boardHashes[name][1] == 'f') {
        deletes.unshift(boardHashes[name]);
      }
      else {
        deletes.push(boardHashes[name]);
      }

    }
    return { 'delete': deletes, 'files': changedFiles, 'folders': changedFolders };
  }
}
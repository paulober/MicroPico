import * as fs from 'fs';
import { promises as fsp } from 'fs';
import * as crypto from 'crypto';
import Logger from '../logger';
import Utils from '../utils';
import Shell from './shell';
import SettingsWrapper from '../settingsWrapper';

export default class ProjectStatus {
  private shell: Shell | null;
  private logger: Logger;
  private utils: Utils;
  private localFolder?: string;
  private settings: SettingsWrapper;
  private allowedFileTypes: any;
  private content: never[];
  private boardFileHashes: { [key: string]: (string | number)[]; };
  private changed: boolean;
  private localFileHashes: { [key: string]: (string | number)[]; };

  constructor(shell: Shell | null, settings: SettingsWrapper, localFolder?: string) {
    this.shell = shell;
    this.logger = new Logger('ProjectStatus');
    this.utils = new Utils(settings);
    this.localFolder = localFolder;
    this.settings = settings;
    this.allowedFileTypes = this.settings.getAllowedFileTypes();
    this.content = [];
    this.boardFileHashes = {};
    this.localFileHashes = {};
    this.changed = false;

    let _this = this;
    this.getLocalFilesHashed()
      .then(hashes => {
        if (typeof hashes === "boolean") {
            return;
        } else {
            _this.localFileHashes = hashes;
        }
      });
  }

  public async read(): Promise<any> {
    let result = await this.shell?.readFile('project.pico-w-go');

    let json: any = [];

    if (result?.str !== '') {
      json = JSON.parse(result?.str);
    }
    this.content = json;
    this.processFile();

    return json;
  }

  /**
   * Writing project status file to the board.
   */
  public async write(): Promise<void> {
    try {
      if (this.changed) {
        this.logger.info('Writing project status file to board');
        let boardHashArray = Object.values(this.boardFileHashes);
        let projectFileContent = Buffer.from(JSON.stringify(
          boardHashArray));
        await this.shell?.writeFile('project.pico-w-go', null,
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

  public update(name: string): void {
    this.changed = true;
    if (!this.localFileHashes[name]) {
      delete this.boardFileHashes[name];
    }
    else {
      this.boardFileHashes[name] = this.localFileHashes[name];
    }
  }

  private processFile(): void {
    for (let i = 0; i < this.content.length; i++) {
      let h = this.content[i];
      this.boardFileHashes[h[0]] = h;
    }
  }

  private getLocalFilesSync(dir: string): string[] {
    return fs.readdirSync(dir);
  }

  private async getLocalFiles(dir: string): Promise<string[]> {
    return await fsp.readdir(dir);
  }

  private async getLocalFilesHashed(files?: string[], path?: string): Promise<false | { [key: string]: (string | number)[]; }> {
    if (!files) {
      try {
        if (this.localFolder === undefined) {
          throw new Error('No local folder set');
        }
        files = await this.getLocalFiles(this.localFolder);
      }
      catch (e) {
        this.logger.error("Couldn't locate file folder");
        return false;
      }
    }
    if (!path) {
      path = '';
    }
    let fileHashes: { [key: string]: (string | number)[] } = {};

    files = this.utils.ignoreFilter(files);

    for (let i = 0; i < files.length; i++) {
      let filename = path + files[i];
      if (filename.length > 0 && filename.substring(0, 1) !== '.') {
        let filePath = this.localFolder + filename;
        let stats = await fsp.lstat(filePath);
        let isDir = stats.isDirectory();
        if (stats.isSymbolicLink()) {
          isDir = filename.indexOf('.') === -1;
        }
        if (isDir) {
          try {
            let filesFromFolder = await this.getLocalFiles(filePath);
            if (filesFromFolder.length > 0) {
              let hash = crypto.createHash('sha256').update(filename).digest(
                'hex');
              fileHashes[filename] = [filename, 'd', hash];
              let hashesInFolder = await this.getLocalFilesHashed(
                filesFromFolder, filename + '/');
              fileHashes = Object.assign(fileHashes, hashesInFolder);
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

  public async prepareFile(pyFolder: string, filePath: string): Promise<(string|number)[]> {
    let contents = await fsp.readFile(filePath);
    let stats = await fsp.lstat(filePath);
    let hash = crypto.createHash('sha256').update(contents).digest('hex');
    let filename = filePath.replace(pyFolder, '').replaceAll('\\', '/');
    return [filename, 'f', hash, stats.size];
  }

  public getChanges(): { [key: string]: (string | number)[][]; } {
    let changedFiles = [];
    let changedFolders = [];
    let deletes = [];
    let boardHashes: { [key: string]: (string | number)[] } = Object.assign({}, this.boardFileHashes);
    let localHashes: { [key: string]: (string | number)[] } = Object.assign({}, this.localFileHashes);

    // all local files
    for (let name in localHashes) {
      let localHash = this.localFileHashes[name];
      let boardHash = boardHashes[name];

      if (boardHash) {
        // check if hash is the same
        if (localHash?.[2] !== boardHash[2]) {

          if (localHash?.[1] === 'f') {
            changedFiles.push(localHash);
          }
          else {
            changedFolders.push(localHash);
          }
        }
        delete boardHashes[name];

      }
      else {
        if (localHash?.[1] === 'f') {
          changedFiles.push(localHash);
        }
        else {
          changedFolders.push(localHash);
        }
      }
    }
    for (let name in boardHashes) {
      if (boardHashes[name][1] === 'f') {
        deletes.unshift(boardHashes[name]);
      }
      else {
        deletes.push(boardHashes[name]);
      }

    }
    return { 'delete': deletes, 'files': changedFiles, 'folders': changedFolders };
  }
}

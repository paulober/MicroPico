'use babel';

import * as util from 'util';
import path from 'path';
import rimraf from 'rimraf';
import os from 'os';
import * as fs from 'fs';
import { promises as fsp } from 'fs';
let homeDir = os.homedir();

// Import this class and create a new logger object in the constructor, providing
// the class name. Use the logger anywhere in the code
// this.logger = new Logger('Pyboard')
// this.logger.warning("Syncing to outdated firmware")
// Result in the console will be:
// [warning] Pyboard | Syncing to outdated firmware

export default class Utils {

  constructor(settings) {
    this.settings = settings;
    this.allowedFileTypes = this.settings.getAllowedFileTypes();
    this._rimraf = util.promisify(rimraf).bind(rimraf);
  }

  // vscode
  static getConfigPath(filename) {
    let plf = process.platform;
    let folder = process.env.APPDATA || (plf == 'darwin' ? process.env.HOME +
      '/Library/Application Support' : plf == 'linux' ? Utils.joinPath(
        homeDir, '.config') : '/var/local');
    if (/^[A-Z]\:[/\\]/.test(folder)) folder = folder.substring(0, 1)
      .toLowerCase() + folder.substring(1);
    return Utils.joinPath(folder, '/Code/User/', filename ? filename : '');
  }

  base64decode(b64str) {
    let content = '';
    let bufferList = [];
    let b64strArr = b64str.split('=');

    for (let i = 0; i < b64strArr.length; i++) {
      let chunk = b64strArr[i];
      if (chunk.length > 0) {

        // Add == to only the last chunk
        // Ignore last 2 items, becuase the original string contains '==' + some extra chars
        if (i == b64strArr.length - 3) {
          chunk += '==';
        }
        else {
          chunk += '=';
        }
        let bc = Buffer.from(chunk, 'base64');
        bufferList.push(bc);
        content += bc.toString();
      }
    }
    return [content, bufferList];
  }

  plural(text, number) {
    return text + (number == 1 ? '' : 's');
  }

  async ensureFileDirectoryExistence(filePath) {
    let dirname = path.dirname(filePath);
    return await this.ensureDirectoryExistence(dirname);
  }

  async ensureDirectoryExistence(dirname) {
    if (!await Utils.exists(dirname)) {
      await this.mkDirRecursive(dirname);
    }
    return true;
  }

  async mkDirRecursive(directory) {
    if (!path.isAbsolute(directory)) 
      return;

    let parent = path.join(directory, '..');

    if (parent !== path.join(path.sep) && !await Utils.exists(parent)) 
      await this.mkDirRecursive(parent);

    if (!await Utils.exists(directory)) 
      await fsp.mkdir(directory);
  }

  static async exists(path) {
    try {
      await fsp.access(path, fs.constants.F_OK);
      return true;
    }
    catch(err) {
      return false;
    }
  }

  ignoreFilter(file_list) {
    let newList = [];
    for (let i = 0; i < file_list.length; i++) {
      let file = file_list[i];
      let filename = file.split('/').pop();
      if (file && file != '' && file.length > 0 && file.substring(0, 1) !=
        '.') {
        if (file.indexOf('.') == -1 || this.settings.sync_all_file_types ||
          this.allowedFileTypes.indexOf(file.split('.').pop()) > -1) {
          if (this.settings.py_ignore.indexOf(file) == -1 && this.settings
            .py_ignore.indexOf(filename) == -1) {
            newList.push(file);
          }
        }
      }
    }
    return newList;
  }

  async rmdir(path) {
    await this._rimraf(path);
  }

  // vscode
  static getConfigPath(filename) {
    let folder = process.env.APPDATA || (process.platform == 'darwin' ?
      process.env.HOME + '/Library/Application Support' : process
      .platform == 'linux' ? Utils.joinPath(homeDir, '.config') :
      '/var/local');
    if (/^[A-Z]\:[/\\]/.test(folder)) folder = folder.substring(0, 1)
      .toLowerCase() + folder.substring(1);
    return Utils.joinPath(folder, '/Code/User/', filename ? filename : '');
  }

  static joinPath() {
    let p = '';
    for (let i = 0; i < arguments.length; i++) {
      p = path.join(p, arguments[i]);
    }
    return Utils.normalize(p);
  }

  static normalize(p) {
    return path.normalize(p).replace(/\\/g, '/');
  }

  static async sleep(timeout) {
    await new Promise(resolve => setTimeout(resolve, timeout));
  }
}
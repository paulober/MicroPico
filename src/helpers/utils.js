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
    this.allowedFileTypes = this.settings.get_allowed_file_types();
    this._rimraf = util.promisify(rimraf).bind(rimraf);
  }

  // runs a worker recursively until a task is Done
  // worker should take 2 params: value and a continuation callback
  // continuation callback takes 2 params: error and the processed value
  // calls 'end' whenever the processed_value comes back empty/null or when an error is thrown
  doRecursively(value, worker, end) {
    let _this = this;
    try {
      worker(value, function(err, value_processed, done) {
        if (err) {
          end(err);
        }
        else if (done) {
          end(null, value_processed);
        }
        else {
          setTimeout(function() {
            _this.doRecursively(value_processed, worker, end);
          }, 20);
        }
      });
    }
    catch (e) {
      console.error('Failed to execute worker:');
      console.error(e);
      end(e);
    }
  }

  doRecursivelyAsync(value, worker) {
    const promise = new Promise((resolve, reject) => {
      this.doRecursively(value, worker, (err, val) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(val);
        }
      });
    });

    return promise;
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

  parse_error(content) {
    let errIndex = content.indexOf('OSError:');
    if (errIndex > -1) {
      return Error(content.slice(errIndex, content.length - 2));
    }
    else {
      return null;
    }
  }

  ensureFileDirectoryExistence(filePath) {
    let dirname = path.dirname(filePath);
    return this.ensureDirectoryExistence(dirname);
  }

  async ensureFileDirectoryExistenceAsync(filePath) {
    let dirname = path.dirname(filePath);
    return await this.ensureDirectoryExistenceAsync(dirname);
  }

  ensureDirectoryExistence(dirname) {
    if (!fs.existsSync(dirname)) {
      this.mkDirRecursive(dirname);
    }
    return true;
  }

  async ensureDirectoryExistenceAsync(dirname) {
    if (!await this.exists(dirname)) {
      await this.mkDirRecursiveAsync(dirname);
    }
    return true;
  }

  mkDirRecursive(directory) {
    let parent = path.join(directory, '..');
    if (parent !== path.join(path.sep) && !fs.existsSync(parent)) this
      .mkDirRecursive(parent);
    if (!fs.existsSync(directory)) fs.mkdirSync(directory);
  }

  async mkDirRecursiveAsync(directory) {
    if (!path.isAbsolute(directory)) 
      return;

    let parent = path.join(directory, '..');

    if (parent !== path.join(path.sep) && !await this.exists(parent)) 
      await this.mkDirRecursiveAsync(parent);

    if (!await this.exists(directory)) 
      await fsp.mkdir(directory);
  }

  async exists(path) {
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

  rmdir(path, cb) {
    this.rmdirAsync(path)
    .then(() => {
      if (cb) cb();
    })
    .catch(err => {
      if (cb) cb(err);
    });
  }

  async rmdirAsync(path) {
    await this._rimraf(path);
  }

  calculateIntVersion(version) {
    let knownTypes = ['a', 'b', 'rc', 'r'];
    if (!version) {
      return 0;
    }
    let versionParts = version.split('.');
    let dots = versionParts.length - 1;
    if (dots == 2) {
      versionParts.push('0');
    }

    for (let i = 0; i < knownTypes.length; i++) {
      let t = knownTypes[i];
      if (versionParts[3] && versionParts[3].indexOf(t) > -1) {
        versionParts[3] = versionParts[3].replace(t, '');
      }
    }

    let versionString = '';

    for (let i = 0; i < versionParts.length; i++) {
      let val = versionParts[i];
      if (parseInt(val) < 10) {
        versionParts[i] = '0' + val;
      }
      versionString += versionParts[i];
    }
    return parseInt(versionString);
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

  _wasFileNotExisting(exception) {
    let error_list = ['ENOENT', 'ENODEV', 'EINVAL', 'OSError:'];
    let stre = exception.message;
    for (let i = 0; i < error_list.length; i++) {
      if (stre.indexOf(error_list[i]) > -1) {
        return true;
      }
    }
    return false;
  }

  int16(int) {
    let b = Buffer.alloc(2);
    b.writeUInt16BE(int);
    return b;
  }

  int32(int) {
    let b = Buffer.aloc(4);
    b.writeUInt32BE(int);
    return b;
  }

  isIP(address) {
    let r = RegExp(
      '^http[s]?:\/\/((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])'
    );
    return r.test(address);
  }

  isIP(address) {
    let r = RegExp(
      '^http[s]?:\/\/((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])'
    );
    return r.test(address);
  }
}
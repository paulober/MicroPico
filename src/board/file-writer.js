import { promises as fsp } from 'fs';
import path from 'path';
import * as crypto from 'crypto';
import Utils from '../helpers/utils.js';
import Logger from '../helpers/logger.js';
import Config from '../config.js';

export default class FileWriter {
  constructor(
    shell,
    board,
    settings,
    api
  ) {
    this.shell = shell;
    this.board = board;
    this.settings = settings;
    this.api = api;
    this.config = Config.constants();
    this.MAX_RETRIES = 3;
    this.BIN_CHUNK_SIZE = this.settings.upload_chunk_size;
    this.logger = new Logger('FileWriter');
  }

  async writeFile(filePath) {
    let p = path.parse(filePath);
    let name = p.base;
    let content = await fsp.readFile(filePath); // Buffer
   

    if (!filePath.indexOf(this._getSyncRootPath()) == 0)
        throw 'Cannot transfer this file as it\'s not within the project folder structure.';

    let boardPath = filePath.replace(this._getSyncRootPath(), '').replace(
      '\\', '/');

    await this.writeFileContent(name, boardPath, content);
  }

  async writeFileContent(
    name,
    boardPath,
    content,
    attempt = 0
  ) {
    let canHash = await this._canHash(content);

    let hash = canHash ?
      crypto.createHash('sha256').update(content).digest('hex') :
      null;

    if (boardPath == undefined) 
      boardPath = `/${name}`;

    await this.shell.ensureDirectory(boardPath);
    await this._openFile(boardPath);

    try {
      let counter = 0;

      while (counter * this.BIN_CHUNK_SIZE < content.length) {
        await this._writeChunk(counter, content);
        counter++;
      }

      await this._closeFile();

      if (hash) {
        await this._checkHash(boardPath, hash);
      }
    }
    catch (err) {
      this.logger.warning(err);

      await this._closeFile();
      await this._handleError(err);

      if (attempt < this.MAX_RETRIES) {
        await Utils.sleep(1000);
        await this.writeFileContent(name, boardPath, content, hash, attempt +
          1);
      }
      else {
        throw err;
      }
    }
  }

  async _openFile(name) {
    let command =
      'import ubinascii\r\n' +
      `f = open('${name}', 'wb')\r\n`;

    await this.board.send(command);
  }

  async _writeChunk(counter, content) {
    let start = counter * this.BIN_CHUNK_SIZE;
    let end = Math.min((counter + 1) * this.BIN_CHUNK_SIZE, content.length);
    let chunk = content.base64Slice(start, end);

    await this.board.send(`f.write(ubinascii.a2b_base64('${chunk}'))\r\n`);
  }

  async _closeFile() {
    let command = 'f.close()';
    let data = await this.board.sendWait(command);

    if (data.indexOf('Traceback: ') > -1 || data.indexOf('Error: ') > -1) {
        let errorMessage = data.slice(data.indexOf('Error: ') + 7, -3);
        let err = new Error(`Failed to write file: ${errorMessage}`);
        throw err;
      }
  }

  async _handleError(err) {
    if (err && err.message &&
      (err.message.indexOf('Not enough memory') > -1 || err.message.indexOf(
        'OSError:') > -1)) {

      this.board.safeBoot();
    }
  }

  async _canHash(content) {
    // Is it within the size limit?
    let size = Math.round(content.length/1000);
    let isWithinSizeLimit = size < this.config.hash_check_max_size;

    if (!isWithinSizeLimit)
        return false;

    // Does the board support hashing?
    let response = await this.board.sendWait('import uhashlib\r\nprint("Done")\r\n');
    return response.indexOf('Traceback') == -1;

  }

  async _checkHash(boardPath, localHash) {
    let command =
      'import uhashlib\r\n' +
      'import ubinascii\r\n' +
      'import sys\r\n' +
      'hash = uhashlib.sha256()\r\n' +
      "with open('" + boardPath + "', 'rb') as f:\r\n" +
      '  while True:\r\n' +
      '    c = f.read(' + this.BIN_CHUNK_SIZE + ')\r\n' +
      '    if not c:\r\n' +
      '       break\r\n' +
      '    hash.update(c)\r\n' +
      'sys.stdout.write(ubinascii.hexlify(hash.digest()))\r\n';

    let boardHash = await this.board.sendWait(command);

    if (localHash != boardHash) {
      this.logger.error(
        `localHash (${localHash}) isn't the same as boardHash (${boardHash})!`
        );
      throw 'Hashes do not match between computer and board.';
    }
  }

  _getSyncRootPath() {
    // Remove first and last slash
    let dir = this.settings.sync_folder.replace(/^\/|\/$/g, '');
    let root = `${this.api.getProjectPath()}${path.sep}`;

    if (dir) {
      root = `${root}${dir}${path.sep}`;
    }

    return root;
  }
}
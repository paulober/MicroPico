import { promises as fsp } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import Utils from '../utils';
import Logger from '../logger';
import Config, { Constants } from '../config';
import SettingsWrapper, { SettingsKey } from '../settingsWrapper';
import Pyboard from './pyboard';
import ApiWrapper from '../apiWrapper';
import Shell from './shell';

export default class FileWriter {
  private shell: Shell;
  private board: Pyboard;
  private settings: SettingsWrapper;
  private api?: ApiWrapper;
  private config: Constants;
  private maxRetries: number;
  private binChunkSize: number;
  logger: Logger;

  constructor(
    shell: Shell,
    board: Pyboard,
    settings: SettingsWrapper,
    api?: ApiWrapper
  ) {
    this.shell = shell;
    this.board = board;
    this.settings = settings;
    this.api = api;
    this.config = Config.constants();
    this.maxRetries = 3;
    this.binChunkSize = this.settings.uploadChunkSize;
    this.logger = new Logger('FileWriter');
  }

  public async writeFile(filePath: string) {
    let p = path.parse(filePath);
    let name: string = p.base;
    let content: Buffer = await fsp.readFile(filePath); // Buffer

    if (!(filePath.indexOf(this.getSyncRootPath()) === 0)) {
      throw new Error("Cannot transfer this file as it's not within the project folder structure.");
    }

    let boardPath = filePath
      .replace(this.getSyncRootPath(), '')
      .replaceAll('\\', '/');

    await this.writeFileContent(name, boardPath, content);
  }

  public async writeFileContent(name: string, boardPath: string | null, content: Buffer, attempt: number = 0) {
    let canHash = await this.canHash(content);

    let hash = canHash
      ? crypto.createHash('sha256').update(content).digest('hex')
      : null;

    if (boardPath === undefined || boardPath === null) {
      boardPath = `/${name}`;
    }

    await this.shell.ensureDirectory(boardPath);
    await this.openFile(boardPath);

    try {
      let counter = 0;

      while (counter * this.binChunkSize < content.length) {
        await this.writeChunk(counter, content);
        counter++;
      }

      await this.closeFile();

      if (hash) {
        await this.checkHash(boardPath, hash);
      }
    } catch (err: any) {
      this.logger.warning(err.message.toString());

      await this.closeFile();
      await this.handleError(err);

      if (attempt < this.maxRetries) {
        await Utils.sleep(1000);
        await this.writeFileContent(
          name,
          boardPath,
          content,
          attempt + 1
        );
      } else {
        throw err;
      }
    }
  }

  private async openFile(name: string) {
    let command = 'import ubinascii\r\n' + `f = open('${name}', 'wb')\r\n`;

    await this.board.send(command);
  }

  private async writeChunk(counter: number, content: Buffer) {
    let start = counter * this.binChunkSize;
    let end = Math.min((counter + 1) * this.binChunkSize, content.length);
    // let chunk = content.base64Slice(start, end);
    let chunk = content.subarray(start, end).toString('base64');

    await this.board.send(`f.write(ubinascii.a2b_base64('${chunk}'))\r\n`);
  }

  private async closeFile() {
    let command = 'f.close()';
    let data: string = await this.board.sendWait(command);

    if (data.indexOf('Traceback: ') > -1 || data.indexOf('Error: ') > -1) {
      let errorMessage = data.slice(data.indexOf('Error: ') + 7, -3);
      let err = new Error(`Failed to write file: ${errorMessage}`);
      throw err;
    }
  }

  public async handleError(err: any) {
    if (
      err &&
      err.message &&
      (err.message.indexOf('Not enough memory') > -1 ||
        err.message.indexOf('OSError:') > -1)
    ) {
      this.board.safeboot();
    }
  }

  private async canHash(content: any) {
    // Is it within the size limit?
    let size = Math.round(content.length / 1000);
    let isWithinSizeLimit = size < this.config.hashCheckMaxSize;

    if (!isWithinSizeLimit) {
      return false;
    }

    // Does the board support hashing?
    let response = await this.board.sendWait(
      'import uhashlib\r\nprint("Done")\r\n'
    );
    return response.indexOf('Traceback') === -1;
  }

  private async checkHash(boardPath: string, localHash: string) {
    let command =
      'import uhashlib\r\n' +
      'import ubinascii\r\n' +
      'import sys\r\n' +
      'hash = uhashlib.sha256()\r\n' +
      "with open('" +
      boardPath +
      "', 'rb') as f:\r\n" +
      '  while True:\r\n' +
      '    c = f.read(' +
      this.binChunkSize +
      ')\r\n' +
      '    if not c:\r\n' +
      '       break\r\n' +
      '    hash.update(c)\r\n' +
      'sys.stdout.write(ubinascii.hexlify(hash.digest()))\r\n';

    let boardHash: string = await this.board.sendWait(command);

    if (localHash !== boardHash) {
      this.logger.error(
        `localHash (${localHash}) isn't the same as boardHash (${boardHash})!`
      );
      throw new Error('Hashes do not match between computer and board.');
    }
  }

  private getSyncRootPath(): string {
    // Remove first and last slash
    let dir = (this.settings.get(SettingsKey.syncFolder) as string).replace(/^\/|\/$/g, '');
    let root = `${this.api?.getProjectPath()}${path.sep}`;

    if (dir) {
      root = `${root}${dir}${path.sep}`;
    }

    return root;
  }
}

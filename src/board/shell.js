'use babel';

/*
Shell is something that's started and stopped, rather than being there 
all the time. It puts the mode into Raw REPL when it's instantiated, and 
puts it back in Friendly REPL when it's closed down.

In Raw REPL, you can enter multiple commands separated by line breaks, 
and when you press `Ctrl+D` it will execute that code, initially 
acknowledging with `OK`, giving any output and then returning a Raw REPL
`>` prompt.

It's also possible to run a block of code in Raw REPL by using the
`board.run()` method. This switches to Raw REPL, runs the code by sending 
`Ctrl+D`, grabs the response and puts the console back into Friendly REPL.

Friendly REPL is the default mode so the user can type things via the UI.
*/

import Logger from '../helpers/logger.js';
import ApiWrapper from '../main/api-wrapper.js';
import Utils from '../helpers/utils.js';
import Config from '../config.js';
import path from 'path';
import FileWriter from './file-writer.js';
import { createDeflate } from 'zlib';
import { pipeline } from 'stream';
import { createReadStream, createWriteStream } from 'fs';
import { promisify } from 'util';

const pipe = promisify(pipeline);

export default class Shell {

  constructor(board, settings) {
    this.config = Config.constants();
    this.settings = settings;
    this.BIN_CHUNK_SIZE = this.settings.upload_chunk_size;
    this.EOF = '\x04'; // reset (ctrl-d)
    this.RETRIES = 2;
    this.board = board;
    this.api = new ApiWrapper();
    this.logger = new Logger('Shell');
    this.utils = new Utils(settings);
    this.mcuRootFolder = '/';
    this.working = false;
    this.interruptCb = null;
    this.interrupted = false;
  }

  async initialise() {
    this.logger.silly('Try to enter raw mode');

    // 3 = RAW_REPL
    if (this.board.status != 3) {
      await this.board.enterRawReplNoReset();
    }
  }

  async getFreeSpace() {
    let command =
      'import os, sys\r\n' +
      "_s = os.statvfs('" + this.mcuRootFolder + "')\r\n" +
      'sys.stdout.write(str(s[0]*s[3])\r\n' +
      'del(_s)\r\n';

    return await this.board.sendWait(command);
  }

  async decompress(name) {
    let command =
      'import uzlib\r\n' +
      'def decompress(name):\r\n' +
      "  with open(name,'rb+') as d:\r\n" +
      '    c = uzlib.decompress(d.read())\r\n' +
      "  with open(name,'wb') as d:\r\n" +
      '      d.write(c)\r\n' +
      '  del(c)\r\n' +
      "decompress('" + name + "')\r\n";

    return await this.board.sendWait(command, null, 40000);
  }

  async compress(filepath, name) {
    let deflator = createDeflate({
      level: 2
    });
    let source = createReadStream(filepath);
    let destination = createWriteStream(name);
    await pipe(source, deflator, destination);
  }

  async writeFile(name, file_path, contents) {
    let fw = new FileWriter(this, this.board, this.settings, this.api);
    await fw.writeFileContent(name, file_path, contents, 0);
  }

  async ensureDirectory(fullPath) {
    if (fullPath == undefined || fullPath == null) {
      return;
    }

    let parts = fullPath.split(path.sep);

    // Remove filename
    parts.pop();

    if (parts.length == 0) {
      return;
    }

    let command = 'import os\r\n' +
      'def ensureFolder(folder):\r\n' +
      '   try:\r\n' +
      '     os.mkdir(folder)\r\n' +
      '   except OSError:\r\n' +
      '     ...\r\n' +
      '\r\n';

    for (let i = 1; i <= parts.length; i++) {
      command += `ensureFolder("${parts.slice(0, i).join('/')}")\r\n`;
    }

    await this.board.sendWait(command, null, 30000);
  }

  async readFile(name) {
    this.working = true;

    // avoid leaking file handles 
    let command = 'import ubinascii,sys' + '\r\n' +
      "with open('" + name + "', 'rb') as f:" + '\r\n' +
      '  while True:' + '\r\n' +
      '    c = ubinascii.b2a_base64(f.read(' + this.BIN_CHUNK_SIZE + '))' +
      '\r\n' +
      '    sys.stdout.write(c)' + '\r\n' +
      "    if not len(c) or c == b'\\n':" + '\r\n' +
      '        break\r\n';

    let content = await this.board.sendWait(command, null, 60000);

    // Workaround for the "OK" return of soft reset, which is sometimes returned with the content
    if (content.indexOf('OK') == 0) {
      content = content.slice(2, content.length);
    }
    // Did an error occur 
    if (content.includes('Traceback (')) {
      // some type of error
      this.logger.silly('Traceback error reading file contents: ' + content);
      // pass the error back
      throw content;
    }

    let decodeResult = this.utils.base64decode(content.replace(/[\r\n]/g, ''));
    let contentBuffer = Buffer.concat(decodeResult[1]);
    let contentStr = decodeResult[0].toString();

    this.working = false;

    return {
      buffer: contentBuffer,
      str: contentStr
    };
  }

  async list(root, recursive = false, hash = false) {
    let toPythonBoolean = (value) => value ? 'True' : 'False';

    // Based on code by Jos Verlinde:
    // https://gist.github.com/Josverl/a6f6be74e5193a8145e351ff9439ae3e
    let command =
      '# get file and folder information and return this as JSON\r\n' +
      '# params : folder , traverse subdirectory , output format, gethash\r\n' +
      '# intended to allow simple processing of files\r\n' +
      '# jos_verlinde@hotmail.com\r\n' +
      'import uos as os, json\r\n' +
      'import uhashlib,ubinascii\r\n' +
      '\r\n' +
      'def listdir(path=".",sub=False,JSON=True,gethash=False):\r\n' +
      '    #Lists the file information of a folder\r\n' +
      '    li=[]\r\n' +
      '    if path==".": #Get current folder name\r\n' +
      '        path=os.getcwd()\r\n' +
      '    files = os.listdir(path)\r\n' +
      '    for file in files:\r\n' +
      '        #get size of each file \r\n' +
      '        info = {"Path": path, "Name": file, "Size": 0}\r\n' +
      '        if path[-1]=="/":\r\n' +
      '            full = "%s%s" % (path, file)\r\n' +
      '        else:\r\n' +
      '            full = "%s/%s" % (path, file)\r\n' +
      '        subdir = []\r\n' +
      '        try:\r\n' +
      '            stat = os.stat(full)\r\n' +
      '            if stat[0] & 0x4000:  # stat.S_IFDIR\r\n' +
      '                info["Type"] = "dir"\r\n' +
      '                #recurse folder(s)\r\n' +
      '                if sub == True:\r\n' +
      '                    subdir = listdir(path=full,sub=True,JSON=False)\r\n' +
      '            else:\r\n' +
      '                info["Size"] = stat[6]\r\n' +
      '                info["Type"] = "file"\r\n' +
      '                if(gethash):\r\n' +
      '                    with open(full, "rb") as f:\r\n' +
      '                        h = uhashlib.sha256(f.read())\r\n' +
      '                        info["Hash"] = ubinascii.hexlify(h.digest())\r\n' +
      '        except OSError as e:\r\n' +
      '            info["OSError"] = e.args[0]\r\n' +
      '            info["Type"] = "OSError"\r\n' +
      '        info["Fullname"]=full\r\n' +
      '        li.append(info)\r\n' +
      '        #recurse folder(s)\r\n' +
      '        if sub == True: \r\n' +
      '            li = li + subdir\r\n' +
      '    if JSON==True:\r\n' +
      '        return json.dumps(li)\r\n' +
      '    else: \r\n' +
      '        return li\r\n' +
      '\r\n' +
      `print(listdir("${root}", ${toPythonBoolean(recursive)}, True, ${toPythonBoolean(hash)}))`;

    let raw = await this.board.sendWait(command, null, 10000);
    return JSON.parse(raw);
  }

  async removeFile(name) {
    let command =
      'import os\r\n' +
      "os.remove('" + name + "')\r\n";

    await this.board.sendWait(command);
  }

  async renameFile(oldName, newName) {
    let command =
      'import os\r\n' +
      "os.rename('" + oldName + "', '" + newName + "')\r\n";

    await this.board.sendWait(command);
  }

  async createDir(name) {
    let command =
      'import os\r\n' +
      "os.mkdir('" + name + "')\r\n";
    await this.board.sendWait(command);
  }

  async changeDir(name) {
    let command =
      'import os\r\n' +
      "os.chdir('" + name + "')\r\n";
    await this.board.sendWait(command);
  }

  async removeDir(name) {
    let command =
      'import os\r\n' +
      "os.rmdir('" + name + "')\r\n";
    await this.board.sendWait(command);
  }

  async reset() {
    let command =
      'import machine\r\n' +
      'machine.reset()\r\n';

    await this.board.send(command);
    await this.board.send(this.EOF, false); // Execute.
    await Utils.sleep(1000);
    await this.board.reconnect();
  }

  async safebootRestart() {
    await this.board.safeboot(4000);
    await this.board.enterRawReplNoReset();
  }

  async eval(c, timeout) {
    return await this.sendWait(c, null, timeout);
  }

  async exit() {
    await this.stopWorking();
    await this.cleanClose();
  }

  async stopWorking() {
    // This is the limit that this can be async-awaitified.
    // Does rely on callbacks to work.
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, reject) => {
      let _this = this;
      if (this.working) {
        _this.logger.info(
          'Exiting shell while still working, doing interrupt');
        let cb_done = false;
        this.interruptCb = function() {
          cb_done = true;
          _this.working = false;
          _this.interrupted = false;
          _this.interruptCb = null;
          _this.logger.info('Interrupt done, closing');
          resolve();
        };
        this.interrupted = true;
        setTimeout(function() {
          if (!cb_done) {
            _this.logger.info(
              'Interrupt timed out, continuing anyway');
            resolve();
          }
        }, 1000);
      }
      else {
        _this.logger.info('Not working, continuing closing');
        resolve();
      }
    });
  }

  async cleanClose() {
    this.logger.info('Closing shell cleanly');

    if (this.settings.reboot_after_upload) {
      this.logger.info('Rebooting after upload');
      // No need to await this.
      this.reset();
      return;
    }

    await this.board.enterFriendlyRepl();
    await this.board.send('\r\n');

    this.logger.info('Closed successfully');

    if (this.board.connection.type != 'serial') {
      await this.board.disconnectSilent();
    }
  }

  async close() {
    this.logger.info('Closing shell cleanly');

    await this.board.enterFriendlyRepl();
    await this.board.send('\r\n');

    this.logger.info('Closed successfully');

    if (this.board.connection.type != 'serial') {
      await this.board.disconnectSilent();
    }
  }
}
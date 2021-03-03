'use babel';
import * as vscode from 'vscode';
import Logger from '../helpers/logger.js';
import ApiWrapper from '../main/api-wrapper.js';
import { Socket } from 'net';

export default class Term {

  constructor(cb, board, settings) {
    this.port = parseInt(Math.random() * 1000 + 1337);
    this.host = '127.0.0.1';
    this.termBuffer = '';
    this.terminalName = 'Pico Console';
    this.shellPrompt = '>>> ';
    this.board = board;
    this.logger = new Logger('Term');
    this.api = new ApiWrapper();
    this.onMessage = function() {};
    this.lastWrite = '';
    this.settings = settings;
    this.connectionAttempt = 1;
    this.active = true;
    this.terminal = null;
    this.createFailed = false;
    this.stream = new Socket();
    this.connected = false;
    this.isWindows = process.platform == 'win32';

    //dragging
    this.startY = null;
    let _this = this;
    this._create();

    this._connect(cb);

    vscode.window.onDidCloseTerminal(function(event) {
      if (!_this.createFailed && event._name == _this.terminalName) {
        _this._create();
      }
    });
  }

  show() {
    this.active = true;
    this.terminal.show();
  }

  hide() {
    this.active = false;
    this.terminal.hide();
  }

  _connectReattempt(cb) {
    let _this = this;
    this.connectionAttempt += 1;
    this.connected = false;
    setTimeout(function() {
      _this._connect(cb);
    }, 200);

  }

  _create() {
    this.createFailed = false;
    this.port = parseInt(Math.random() * 1000 + 1337);
    try {
      let termpath = this.api.getPackagePath() + 'terminalExec.js';
      let shellpath = this.isWindows ? 'node.exe' : 'node';
      this.terminal = vscode.window.createTerminal({ name: this.terminalName,
          shellPath: shellpath, shellArgs: [termpath, this.port
        .toString()] });
      if (this.settings.open_on_start) {
        this.show();
      }
    }
    catch (e) {
      this.createFailed = true;
    }
  }

  _connect(cb) {

    if (this.connectionAttempt > 20) {
      cb(new Error(
        'Unable to start the terminal. Restart VSC or file an issue on our github'
        ));
      return;
    }
    let _this = this;
    let stopped = false;
    this.connected = false;
    this.stream = new Socket();
    this.stream.connect(this.port, this.host);
    this.stream.on('connect', function(err) {
      if (err) {
        _this.logger.info('Terminal failed to connect');
      }
      else {
        _this.logger.info('Terminal connected');
      }
      _this.connected = true;
      cb(err);
    });
    this.stream.on('timeout', function() {
      if (!stopped) {
        stopped = true;
        _this._connectReattempt(cb);
      }
    });
    this.stream.on('error', function(error) {
      _this.logger.warning('Error while connecting to term');
      _this.logger.warning(error);
      if (!stopped) {
        stopped = true;
        _this._connectReattempt(cb);
      }
    });
    this.stream.on('close', function(had_error) {
      _this.logger.warning('Term connection closed');
      _this.logger.warning(had_error);
      if (!stopped) {
        stopped = true;
        _this._connectReattempt(cb);
      }
    });
    this.stream.on('end', function() {
      _this.logger.warning('Term connection ended ');
      if (!stopped) {
        stopped = true;
        _this._connectReattempt(cb);
      }
    });
    this.stream.on('data', function(data) {
      _this._userInput(data);
    });
  }

  setOnMessageListener(cb) {
    this.onMessage = cb;
  }

  writeln(mssg) {
    this.stream.write(mssg + '\r\n');
    this.lastWrite += mssg;
    if (this.lastWrite.length > 20) {
      this.lastWrite = this.lastWrite.substring(1);
    }
  }

  write(mssg) {
    this.stream.write(mssg);
    this.lastWrite += mssg;
    if (this.lastWrite.length > 20) {
      this.lastWrite = this.lastWrite.substring(1);
    }
  }

  writelnAndPrompt(mssg) {
    this.writeln(mssg + '\r\n');
    this.writePrompt();
  }

  writePrompt() {
    this.write(this.shellPrompt);
  }

  enter() {
    this.write('\r\n');
  }

  clear() {
    this.lastWrite = '';
  }

  _userInput(input) {
    this.onMessage(input);
  }
}
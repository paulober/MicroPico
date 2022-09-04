import * as vscode from 'vscode';
import Logger from './logger';
import ApiWrapper from './apiWrapper';
import { Socket } from 'net';
import Pyboard from './rp2/pyboard';
import SettingsWrapper, { SettingsKey } from './settingsWrapper';

export default class Term {
  private port: number;
  private host: string;
  public termBuffer: string;
  private terminalName: string;
  private shellPrompt: string;
  public board: Pyboard;
  private logger: Logger;
  private api: ApiWrapper;
  private onMessage: (message: string) => void;
  private lastWrite: string;
  private settings: SettingsWrapper;
  private connectionAttempt: number;
  public active: boolean;
  private terminal: vscode.Terminal | null;
  private createFailed: boolean;
  private stream: Socket;
  public connected: boolean;
  public isWindows: boolean;
  public startY: null;

  constructor(board: Pyboard, settings: SettingsWrapper) {
    // TODO: consider using ... as float to int conversion instead of .toString() -> parseInt
    /**
    function float2int (value) {
      return value | 0;
    }

    float2int(3.75); //3 - always just truncates decimals

    //other options
    Math.floor( 3.75 );//3 - goes to floor , note (-3.75 = -4)
    Math.ceil( 3.75 ); //4 - goes to ceiling, note (-3.75 = -3)
    Math.round( 3.75 );//4 
    */
    // TODO: check if port is used before trying to connect
    this.port = parseInt((Math.random() * 1000 + 1337).toString());
    this.host = '127.0.0.1';
    this.termBuffer = '';
    this.terminalName = 'Pico W Console';
    this.shellPrompt = '>>> ';
    this.board = board;
    this.logger = new Logger('Term');
    this.api = new ApiWrapper();
    this.onMessage = function () {};
    this.lastWrite = '';
    this.settings = settings;
    this.connectionAttempt = 1;
    this.active = true;
    this.terminal = null;
    this.createFailed = false;
    this.stream = new Socket();
    this.connected = false;
    this.isWindows = process.platform === 'win32';

    //dragging
    this.startY = null;
    let _this = this;

    vscode.window.onDidCloseTerminal(async function (event) {
      if (!_this.createFailed && event.name === _this.terminalName) {
        await _this.create();
      }
    });
  }

  public async initialize(cb: (err: Error) => void) {
    await this.create();
    this.connect(cb);
  }

  public show() {
    this.active = true;
    this.terminal?.show();
  }

  public hide() {
    this.active = false;
    this.terminal?.hide();
  }

  private connectReattempt(cb: (err: Error) => void) {
    let _this = this;
    this.connectionAttempt += 1;
    this.connected = false;
    setTimeout(function () {
      _this.connect(cb);
    }, 200);
  }

  private async create(): Promise<void> {
    this.createFailed = false;
    // TODO: check if port is used before trying to connect
    this.port = parseInt((Math.random() * 1000 + 1337).toString());

    try {
      let termpath = this.api.getPackagePath() + '/terminalExec.py';
      let shellpath = this.settings.detectedPythonPath;

      let existingProcessId = this.settings.context
        ? this.settings.context.get('processId')
        : null;

      for (let t of vscode.window.terminals) {
        let p = await t.processId;

        if (p === existingProcessId) {
          t.dispose();
          break;
        }
      }

      this.terminal = vscode.window.createTerminal(
        this.terminalName,
        shellpath,
        [termpath, this.port.toString()]
      );

      console.log("Created terminal on port: " + this.port.toString());

      this.settings.context?.update('processId', await this.terminal.processId);

      if (this.settings.get(SettingsKey.openOnStart)) {
        this.show();
      }
    } catch (e) {
      this.createFailed = true;
    }
  }

  private connect(cb: (err: Error) => void) {
    if (this.connectionAttempt > 20) {
      cb(
        new Error(
          'Unable to start the terminal. Restart VSC or file an issue on our github'
        )
      );
      return;
    }
    let _this = this;
    let stopped = false;
    this.connected = false;
    this.stream = new Socket();
    this.stream.connect(this.port, this.host);
    this.stream.on('connect', function (err: Error) {
      if (err) {
        _this.logger.info('Terminal failed to connect');
      } else {
        _this.logger.info('Terminal connected');
      }
      _this.connected = true;
      cb(err);
    });
    this.stream.on('timeout', function () {
      if (!stopped) {
        stopped = true;
        _this.connectReattempt(cb);
      }
    });
    this.stream.on('error', function (error) {
      _this.logger.warning('Error while connecting to term');
      _this.logger.warning(error.message.toString());
      if (!stopped) {
        stopped = true;
        _this.connectReattempt(cb);
      }
    });
    this.stream.on('close', function (hadError: any) {
      _this.logger.warning('Term connection closed');
      _this.logger.warning(hadError.toString());
      if (!stopped) {
        stopped = true;
        _this.connectReattempt(cb);
      }
    });
    this.stream.on('end', function () {
      _this.logger.warning('Term connection ended ');
      if (!stopped) {
        stopped = true;
        _this.connectReattempt(cb);
      }
    });
    this.stream.on('data', function (data: string) {
      _this.userInput(data);
    });
  }

  public setOnMessageListener(cb: (message: string) => void) {
    this.onMessage = cb;
  }

  public writeln(mssg: string) {
    this.stream.write(mssg + '\r\n');
    this.lastWrite += mssg;
    if (this.lastWrite.length > 20) {
      this.lastWrite = this.lastWrite.substring(1);
    }
  }

  public write(mssg: string) {
    this.stream.write(mssg);
    this.lastWrite += mssg;
    if (this.lastWrite.length > 20) {
      this.lastWrite = this.lastWrite.substring(1);
    }
  }

  public writelnAndPrompt(mssg: string) {
    this.writeln(mssg + '\r\n');
    this.writePrompt();
  }

  public writePrompt() {
    this.write(this.shellPrompt);
  }

  public enter() {
    this.write('\r\n');
  }

  public clear() {
    this.lastWrite = '';
  }

  private userInput(input: string) {
    this.onMessage(input);
  }
}

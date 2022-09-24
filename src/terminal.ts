import * as vscode from 'vscode';
import Logger from './logger';
import ApiWrapper from './apiWrapper';
import Pyboard from './rp2/pyboard';
import SettingsWrapper, { SettingsKey } from './settingsWrapper';
import { c, COLORS, C_RESET, OPTIONS } from './paintBox';

export default class Term {
  public termBuffer: string = '';
  private terminalName: string = 'Pico (W) Console';
  /**
   * The REPL prompt. Defaults to '>>> '.
   */
  private shellPrompt: string = `${c(COLORS.cyan, [OPTIONS.bold], true)}>>>${C_RESET} `;
  public board: Pyboard;
  private logger: Logger;
  private api: ApiWrapper;
  private onMessage: (message: string) => void;
  private lastWrite: string = '';
  private settings: SettingsWrapper;
  public active: boolean;
  private terminal?: vscode.Terminal;
  private writeEmitter?: vscode.EventEmitter<string>;
  private pty?: vscode.Pseudoterminal;
  private createFailed: boolean;
  public connected: boolean;
  public isWindows: boolean;
  public startY: null;

  constructor(board: Pyboard, settings: SettingsWrapper) {
    this.board = board;
    this.logger = new Logger('Term');
    this.api = new ApiWrapper();
    this.onMessage = function () {};
    this.settings = settings;
    this.active = true;
    this.terminal = undefined;
    this.createFailed = false;
    this.connected = false;
    this.isWindows = process.platform === 'win32';

    // dragging
    this.startY = null;
  }

  public async initialize(cb: (err?: Error) => void) {
    await this.create(cb);
  }

  public show() {
    this.active = true;
    this.terminal?.show();
  }

  public hide() {
    this.active = false;
    this.terminal?.hide();
  }

  private async create(cb: (err?: Error) => void): Promise<void> {
    this.createFailed = false;

    try {
      let existingProcessId: number | null | undefined = this.settings.context
        ? this.settings.context.get('processId')
        : null;

      for (let t of vscode.window.terminals) {
        let p = await t.processId;

        if (p === existingProcessId) {
          t.dispose();
          break;
        }
      }

      this.writeEmitter = new vscode.EventEmitter<string>();
      this.pty = {
        onDidWrite: this.writeEmitter.event,
        open: () => {
          //this.writeEmitter?.fire('Pico-W-Go console\r\n');
          this.connected = true;
          cb();
        },
        close: () => {
          this.connected = false;

          // TODO: maybe recreate
          this.create(cb);
        },
        handleInput: (data: string) => {
          if (!this.createFailed) {
            // do not write user input to terminal
            // because it will be written by the board
            // this.writeEmitter?.fire(data);

            // send user input to pico
            this.userInput(data);
          }
        },
      };

      this.terminal = vscode.window.createTerminal({
        name: this.terminalName,
        pty: this.pty!,
        isTransient: true,
      });

      console.log('Created terminal');

      this.settings.context?.update(
        'processId',
        await this.terminal?.processId
      );

      if (this.settings.get(SettingsKey.openOnStart)) {
        this.show();
      }
    } catch (e) {
      this.createFailed = true;
      cb(e as Error);
    }
  }

  public setOnMessageListener(cb: (message: string) => void) {
    this.onMessage = cb;
  }

  public writeln(msg: string) {
    this.writeEmitter?.fire(msg + '\r\n');
    //this.terminal?.sendText(mssg + '\r\n');
    this.lastWrite += msg;
    if (this.lastWrite.length > 20) {
      this.lastWrite = this.lastWrite.substring(1);
    }
  }

  public write(msg: string) {
    this.writeEmitter?.fire(msg);
    // this.terminal?.sendText(msg);
    this.lastWrite += msg;
    if (this.lastWrite.length > 20) {
      this.lastWrite = this.lastWrite.substring(1);
    }
  }

  public writelnAndPrompt(msg: string) {
    this.writeln(msg);
    this.writePrompt();
  }

  public writePrompt() {
    this.write(this.shellPrompt);
  }

  public enter() {
    this.writeEmitter?.fire('\r\n');
  }

  public clear() {
    this.lastWrite = '';
  }

  private userInput(input: string) {
    this.onMessage(input);
  }
}

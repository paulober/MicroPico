import * as vscode from 'vscode';
import Logger from './logger';
import ApiWrapper from './apiWrapper';
import Pyboard from './rp2/pyboard';
import SettingsWrapper, { SettingsKey } from './settingsWrapper';
import { c, COLORS, C_RESET, OPTIONS } from './paintBox';
import path from 'path';

export default class Term {
  public termBuffer: string = '';
  private terminalName: string = 'Pico (W) Console';
  /**
   * The REPL prompt. Defaults to '>>> '.
   */
  private shellPrompt: string = `${c(
    COLORS.cyan,
    [OPTIONS.bold],
    true
  )}>>>${C_RESET} `;
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

  public async initialize(cb: (err?: Error) => void, extensionPath: string) {
    await this.create(cb, extensionPath);
  }

  public show() {
    this.active = true;
    this.terminal?.show();
  }

  public hide() {
    this.active = false;
    this.terminal?.hide();
  }

  private async create(
    cb: (err?: Error) => void,
    extensionPath: string
  ): Promise<void> {
    this.createFailed = false;

    try {
      const disposable = vscode.window.registerTerminalProfileProvider(
        'picowgo.terminalProfile',
        {
          provideTerminalProfile: (
            token: vscode.CancellationToken
          ): vscode.ProviderResult<vscode.TerminalProfile> => {
            return {
              options: {
                name: this.terminalName,
                iconPath: vscode.Uri.file(
                  path.join(extensionPath, 'images', 'pico-w.png')
                ),
                pty: this.pty!,
                isTransient: true,
              },
            };
          },
        }
      );
      vscode.window.createTerminal();

      console.log('Created terminal');
    } catch (e) {
      this.createFailed = true;
      cb(e as Error);
    }
  }

  /**
   * Initialize the terminal options and the pty.
   *
   * @param extensionPath context.extensionPath
   * @returns The extension terminal options.
   */
  public async initializeTerminalOptionsAsync(
    extensionPath: string,
    cb: (err?: Error) => void
  ): Promise<vscode.ProviderResult<vscode.TerminalProfile>> {
    this.createFailed = false;

    try {
      const existingProcessId: number | null | undefined = this.settings.context
        ? this.settings.context.get('processId')
        : null;

      for (const t of vscode.window.terminals) {
        const p = await t.processId;

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
          this.create(cb, extensionPath);
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

      return {
        options: {
          name: this.terminalName,
          iconPath: vscode.Uri.file(
            path.join(extensionPath, 'images', 'pico-w.png')
          ),
          pty: this.pty!,
          isTransient: true,
          location: vscode.TerminalLocation.Panel,
        },
      };
    } catch (err) {
      this.createFailed = true;
      cb(err as Error);
      return null;
    }
  }

  /**
   * Load terminal registered via {@link initializeTerminalOptionsAsync} and
   * registerTerminalProfileProvider into property and show
   * it if `openOnStart` is `true`.
   *
   * @returns `true` if terminal could be found, `false` otherwise.
   */
  public async loadTerminalAsync(options: vscode.ExtensionTerminalOptions): Promise<boolean> {
    /*this.terminal = vscode.window.terminals.find(
      (t) => t.name === this.terminalName
    );*/

    this.terminal = vscode.window.createTerminal(options);

    if (this.terminal !== undefined) {
      this.settings.context?.update(
        'processId',
        await this.terminal?.processId
      );

      // open terminal if openOnStart setting is set to true
      if (this.settings.get(SettingsKey.openOnStart) as boolean) {
        this.show();
      }

      return true;
    } else {
      return false;
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

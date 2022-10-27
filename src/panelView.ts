import * as vscode from 'vscode';
import { StatusBarAlignment, window } from 'vscode';
import Term from './terminal';
import ApiWrapper from './apiWrapper';
import Logger from './logger';
import { EventEmitter } from 'events';
import * as _ from 'lodash';
import Pyboard from './rp2/pyboard';
import SettingsWrapper, { SettingsKey } from './settingsWrapper';

const pkg = vscode.extensions.getExtension('paulober.pico-w-go')?.packageJSON;

export default class PanelView extends EventEmitter {
  private settings: SettingsWrapper;
  private board: Pyboard;
  public visible: boolean;
  private api: ApiWrapper;
  public logger: Logger;
  private statusItems: { [key: string]: vscode.StatusBarItem };
  public terminal?: Term;
  private statusItemPrio: any;
  public projectName: string | undefined;
  public stopAction: any;

  constructor(pyboard: Pyboard, settings: SettingsWrapper) {
    super();

    this.settings = settings;
    this.board = pyboard;
    this.visible = true;
    this.api = new ApiWrapper();
    this.logger = new Logger('PanelView');
    this.statusItems = {};
  }

  /**
   * Generate extension terminal options return via callback and the load it into 
   * handling class and at the end show if `picowgo.openOnStart` is `true`.
   * 
   * @param extensionPath context.extensionPath
   * @param cb Callback for registering TerminalProvileProvider via provided options
   * @returns {boolean} `true` if the terminal was created, `false` otherwise
   */
  public async initialize(
    extensionPath: string,
    cb: (options: vscode.ProviderResult<vscode.TerminalProfile>) => void
  ): Promise<boolean> {
    for (let barItem of pkg.statusBar) {
      this.statusItems[barItem.key] = this.createStatusItem(
        barItem.key,
        barItem.name,
        barItem.command,
        barItem.tooltip
      );
    }

    this.setTitle('not connected');

    // terminal logic
    this.setProjectName(this.api.getProjectPath());

    // create terminal
    this.terminal = new Term(this.board, this.settings);

    this.terminal.setOnMessageListener((input) => {
      this.emit('user_input', input);
    });

    const onTermConnect = (err?: Error) => this.emit('term_connected', err);

    const options = await this.terminal?.initializeTerminalOptionsAsync(
      extensionPath,
      onTermConnect
    );

    cb(options);

    return await this.terminal?.loadTerminalAsync(options?.options as vscode.ExtensionTerminalOptions);
  }

  public showQuickPick(): void {
    let items = [];

    let quickPickItems = pkg.contributes.commands;

    for (let qpItem of quickPickItems) {
      if (qpItem.command !== 'picowgo.listCommands') {
        items.push({
          label: qpItem.title,
          description: '',
          cmd: qpItem.command,
        });
      }
    }

    let options = {
      placeHolder: 'Select Action',
    };

    window.showQuickPick(items, options).then(function (selection) {
      if (typeof selection === 'undefined') {
        return;
      }

      vscode.commands.executeCommand(selection.cmd);
    });
  }

  private createStatusItem(
    key: string,
    name: string,
    command: string,
    tooltip: string
  ): vscode.StatusBarItem {
    if (!this.statusItemPrio) {
      this.statusItemPrio = 15;
    }
    let statusBarItem = vscode.window.createStatusBarItem(
      StatusBarAlignment.Left,
      this.statusItemPrio
    );
    statusBarItem.command = command;
    statusBarItem.text = name;
    statusBarItem.tooltip = tooltip;
    if (
      (this.settings.get(SettingsKey.statusbarButtons) &&
        (this.settings.get(SettingsKey.statusbarButtons) as string[]).indexOf(
          key
        ) > -1) ||
      key === 'listcommands'
    ) {
      statusBarItem.show();
    }
    this.statusItemPrio -= 1;
    return statusBarItem;
  }

  private setProjectName(projectPath: string | null): void {
    if (projectPath !== null && projectPath.indexOf('/') > -1) {
      this.projectName = projectPath.split('/').pop();
    } else {
      this.projectName = 'No project';
    }
    this.setButtonState();
  }

  // refresh button display based on current status
  public setButtonState(): void {
    if (this.board.connected) {
      this.setTitle('connected');
    } else {
      this.setTitle('not connected');
    }
  }

  private setButton(name: string, icon: string, text: string): void {
    this.statusItems[name].text = '$(' + icon + ') ' + text;
  }

  private setTitle(status: string): void {
    let icon = 'chrome-close';
    let title = 'Pico W Disconnected';

    if (status === 'connected') {
      icon = 'check';
      title = 'Pico W Connected';
    }

    this.setButton('status', icon, title);
  }

  public hidePanel(): void {
    this.terminal?.hide();
    this.visible = false;
  }

  public showPanel(): void {
    this.terminal?.clear();
    this.terminal?.show();
    this.visible = true;
    this.setButtonState();
  }

  public clearTerminal(): void {
    this.terminal?.clear();
  }

  public startOperation(stopAction: string, shownButtons: string[]): void {
    this.stopAction = stopAction;
    this.hideAllButtons(shownButtons);
  }

  public stopOperation(): void {
    this.showAllButtons();
    this.stopAction = null;
  }

  public hideAllButtons(except?: string[]): void {
    if (except === undefined) {
      except = [];
    }

    for (let button in this.statusItems) {
      if (!_.includes(except, button)) {
        this.statusItems[button].hide();
      }
    }

    this.statusItems['stop'].show();
  }

  public showAllButtons(): void {
    for (let button in this.statusItems) {
      if (
        (this.settings.get(SettingsKey.statusbarButtons) &&
          (this.settings.get(SettingsKey.statusbarButtons) as string[]).indexOf(
            button
          ) > -1) ||
        button === 'listcommands'
      ) {
        this.statusItems[button].show();
      }
    }

    this.statusItems['stop'].hide();
  }

  public setStopAction(action: string): void {
    this.stopAction = action;
  }

  // Tear down any state and detach
  public async destroy() {
    try {
      await this.disconnect();
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(err.message);
      }
    }
  }

  public async disconnect() {
    // not implemented
    // any idea what to do here??
  }
}

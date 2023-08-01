import { StatusBarAlignment, commands, extensions, window } from "vscode";
import type { StatusBarItem } from "vscode";
import Logger from "./logger.mjs";
import { SettingsKey } from "./settings.mjs";
import type Settings from "./settings.mjs";
import { ContextKeys } from "./models/contextKeys.mjs";
import { extId } from "./api.mjs";

interface PkgJSON {
  statusBar: Array<{
    key: string;
    name: string;
    command: string;
    tooltip: string;
  }>;
  contributes: { commands: Array<{ title: string; command: string }> };
}

const pkg = (extensions.getExtension(extId)?.packageJSON as PkgJSON) ?? {
  statusBar: [],
  contributes: { commands: [] },
};

export default class UI {
  private settings: Settings;
  private logger: Logger;
  private visible = false;
  private initialized = false;
  private userOperationOngoing = false;

  private items: { [key: string]: StatusBarItem } = {};

  constructor(settings: Settings) {
    this.settings = settings;
    this.logger = new Logger("UI");
  }

  public init(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    for (const item of pkg.statusBar) {
      this.items[item.key] = this.createStatusBarItem(
        item.key,
        item.name,
        item.command,
        item.tooltip
      );
    }

    this.setState(false);

    this.logger.debug("Initialized");
  }

  /**
   * Show the quick pick menu for Pico-W-Go contributed commands.
   */
  public showQuickPick(): void {
    /*const items: QuickPickItem[] = pkg.contributes.commands
      .filter(item => item.command !== "pico-w-go.listCommands")
      .map(item => ({
        label: item.title,
        kind: QuickPickItemKind.Default,
        description: "",

        // custom property
        cmd: item.command,
      }));

    window
      .showQuickPick(items, { placeHolder: "Select Action" })
      .then(function (selected) {
        if (selected !== undefined) {
          commands.executeCommand(
            (selected as { cmd: string } & QuickPickItem).cmd
          );
        }
      });*/
    void commands.executeCommand("workbench.action.quickOpen", "> MicroPico: ");
  }

  public show(): void {
    if (this.visible) {
      return;
    }

    this.visible = true;
  }

  private setButton(name: string, icon: string, text: string): void {
    this.items[name].text = `$(${icon}) ${text}`;
    this.items[name].show();
  }

  private setState(connected: boolean): void {
    this.setButton(
      "status",
      connected ? "check" : "chrome-close",
      connected ? "Pico Connected" : "Pico Disconnected"
    );
  }

  public refreshState(force: boolean): void {
    this.setState(force);

    void commands.executeCommand("setContext", ContextKeys.isConnected, force);

    return;
  }

  private statusbarItemPriority = 11;

  private createStatusBarItem(
    key: string,
    name: string,
    command: string,
    tooltip: string
  ): StatusBarItem {
    const item = window.createStatusBarItem(
      StatusBarAlignment.Left,
      this.statusbarItemPriority--
    );
    item.text = name;
    item.command = command;
    item.tooltip = tooltip;

    if (
      this.settings.getArray(SettingsKey.statusbarButtons)?.includes(key) ||
      key === "listcommands"
    ) {
      item.show();
    }

    return item;
  }

  public userOperationStarted(): void {
    this.userOperationOngoing = true;
    this.logger.debug("User operation started");

    this.items["run"].hide();
    this.items["stop"].show();
  }

  public userOperationStopped(): void {
    this.userOperationOngoing = false;
    this.logger.debug("User operation stopped");

    this.items["stop"].hide();
    this.items["run"].show();
  }

  public isUserOperationOngoing(): boolean {
    return this.userOperationOngoing;
  }

  public destroy(): void {
    for (const item of Object.values(this.items)) {
      item.dispose();
    }

    this.logger.debug("Destroyed");
  }
}

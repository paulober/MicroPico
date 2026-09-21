import { StatusBarAlignment, commands, l10n, window } from "vscode";
import type { StatusBarItem } from "vscode";
import Logger from "./logger.mjs";
import { SettingsKey } from "./settings.mjs";
import type Settings from "./settings.mjs";
import { ContextKeys } from "./models/contextKeys.mjs";

interface StatusBarButton {
  key: string;
  name: string;
  command: string;
  tooltip: string;
}

// the order here is the order in the status bar
const statusBarButtons = (): StatusBarButton[] => [
  {
    key: "status",
    name: "",
    command: "micropico.toggleConnect",
    tooltip: l10n.t("Toggle board connection"),
  },
  {
    key: "stop",
    name: "$(primitive-square) " + l10n.t("Stop"),
    command: "micropico.universalStop",
    tooltip: l10n.t("Stop"),
  },
  {
    key: "run",
    name: "$(play) " + l10n.t("Run"),
    command: "micropico.run",
    tooltip: l10n.t("Run current file"),
  },
  {
    key: "runselection",
    name: "$(play) " + l10n.t("Run Line"),
    command: "micropico.runselection",
    tooltip: l10n.t("Run selected lines"),
  },
  {
    key: "upload",
    name: "$(triangle-up) " + l10n.t("Upload"),
    command: "micropico.uploadFile",
    tooltip: l10n.t("Upload current file to your board"),
  },
  {
    key: "download",
    name: "$(triangle-down) " + l10n.t("Download"),
    command: "micropico.downloadFile",
    tooltip: l10n.t("Download current file from your board"),
  },
  {
    key: "uploadproject",
    name: "$(triangle-up) " + l10n.t("Upload Project"),
    command: "micropico.upload",
    tooltip: l10n.t("Upload current project to your board"),
  },
  {
    key: "downloadproject",
    name: "$(triangle-down) " + l10n.t("Download Project"),
    command: "micropico.download",
    tooltip: l10n.t(
      "Download project from your board. This will overwrite all files in the sync folder."
    ),
  },
  {
    key: "disconnect",
    name: "$(chrome-close) " + l10n.t("Disconnect"),
    command: "micropico.disconnect",
    tooltip: l10n.t("Disconnect"),
  },
  {
    key: "softreset",
    name: "$(refresh) " + l10n.t("Reset"),
    command: "micropico.reset.soft",
    tooltip: l10n.t("Clears the state of the MicroPython virtual machine"),
  },
  {
    key: "settings",
    name: "$(gear) " + l10n.t("Settings"),
    command: "micropico.globalSettings",
    tooltip: l10n.t("Global MicroPico settings"),
  },
  {
    key: "listserial",
    name: "$(list-unordered) " + l10n.t("List serial ports"),
    command: "micropico.extra.getSerial",
    tooltip: l10n.t("List available serial ports"),
  },
  {
    key: "listcommands",
    name: "$(list-unordered) " + l10n.t("All commands"),
    command: "micropico.listCommands",
    tooltip: l10n.t("List all available MicroPico commands"),
  },
  {
    key: "togglepicowfs",
    name: "$(list-tree) " + l10n.t("Toggle Mpy FS"),
    command: "micropico.toggleFileSystem",
    tooltip: l10n.t("Toggle virtual MicroPico workspace"),
  },
];

export default class UI {
  private settings: Settings;
  private logger: Logger;
  private visible = false;
  private initialized = false;
  private userOperationOngoing = 0;
  private backgroundProgram = false;
  private lastState = false;

  private items: Record<string, StatusBarItem> = {};

  constructor(settings: Settings) {
    this.settings = settings;
    this.logger = new Logger("UI");
  }

  public init(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    for (const item of statusBarButtons()) {
      this.items[item.key] = this.createStatusBarItem(
        item.key,
        item.name,
        item.command,
        item.tooltip
      );
    }
    this.statusbarItemPriority = Object.keys(this.items).length;

    this.setState(false);

    this.logger.debug("Initialized");
  }

  /**
   * Show the quick pick menu for MicroPico contributed commands.
   */
  public showQuickPick(): void {
    void commands.executeCommand("workbench.action.quickOpen", "> MicroPico: ");
  }

  public show(): void {
    if (this.visible) {
      return;
    }

    this.visible = true;

    const sbButtons = this.settings.getArray(SettingsKey.statusbarButtons);
    if (!sbButtons) {
      this.visible = false;

      return;
    }

    for (const key of sbButtons) {
      this.items[key].show();
    }
    this.items.listcommands.show();
  }

  public hide(): void {
    this.visible = false;

    for (const item of Object.values(this.items)) {
      item.hide();
    }
    this.items.listcommands.hide();
  }

  public isHidden(): boolean {
    return !this.visible;
  }

  private setButton(name: string, icon: string, text: string): void {
    this.items[name].text = `$(${icon}) ${text}`;
    if (this.visible) {
      this.items[name].show();
    }
  }

  private setState(connected: boolean): void {
    this.lastState = connected;
    this.setButton(
      "status",
      connected ? "check" : "debug-disconnect",
      connected ? l10n.t("Board Connected") : l10n.t("Board Disconnected")
    );
  }

  public setDisconnecting(): void {
    this.setButton("status", "watch", l10n.t("Closing port..."));
  }

  public getState(): boolean {
    return this.lastState;
  }

  public refreshState(force: boolean): void {
    this.setState(force);

    void commands.executeCommand("setContext", ContextKeys.isConnected, force);

    return;
  }

  private statusbarItemPriority = 14;

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

    /* don't auto activate
    if (
      this.settings.getArray(SettingsKey.statusbarButtons)?.includes(key) ||
      key === "listcommands"
    ) {
      item.show();
    }*/

    return item;
  }

  public userOperationStarted(): void {
    this.userOperationOngoing++;
    this.logger.debug("User operation started");

    // TODO: only if they are not both in settings enabled
    this.items.run.hide();
    this.items.stop.show();
  }

  public userOperationStopped(): void {
    this.userOperationOngoing--;
    this.logger.debug("User operation stopped");

    // TODO: only if they are not both in settings enabled
    if (!this.backgroundProgram) {
      this.items.stop.hide();
      this.items.run.show();
    }
  }

  /** Keeps Stop visible while a program runs in the background. */
  public setBackgroundProgram(running: boolean): void {
    this.backgroundProgram = running;
    if (this.userOperationOngoing > 0) {
      return;
    }

    if (running) {
      this.items.run.hide();
      this.items.stop.show();
    } else {
      this.items.stop.hide();
      this.items.run.show();
    }
  }

  public isUserOperationOngoing(): boolean {
    return this.userOperationOngoing > 0;
  }

  public destroy(): void {
    for (const item of Object.values(this.items)) {
      item.dispose();
    }

    this.logger.debug("Destroyed");
  }
}

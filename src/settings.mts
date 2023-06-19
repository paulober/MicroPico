import type { Memento, WorkspaceConfiguration } from "vscode";
import { window, workspace } from "vscode";
import { PyboardRunner } from "@paulober/pyboard-serial-com";
import { getProjectPath } from "./api.mjs";
import { join } from "path";

export enum SettingsKey {
  autoConnect = "autoConnect",
  manualComDevice = "manualComDevice",
  syncFolder = "syncFolder",
  additionalSyncFolders = "additionalSyncFolders",
  syncAllFileTypes = "syncAllFileTypes",
  syncFileTypes = "syncFileTypes",
  pyIgnore = "pyIgnore",
  openOnStart = "openOnStart",
  statusbarButtons = "statusbarButtons",
  gcBeforeUpload = "gcBeforeUpload",
  softResetAfterUpload = "softResetAfterUpload",
  pythonPath = "pythonPath",
}

export type Setting = string | boolean | string[] | null | undefined;

export default class Settings {
  private config: WorkspaceConfiguration;
  public context: Memento;
  public pythonExecutable?: string;

  constructor(context: Memento) {
    this.config = workspace.getConfiguration("picowgo");

    this.context = context;
    this.pythonExecutable = this.getString(SettingsKey.pythonPath);
  }

  public get(key: SettingsKey): Setting {
    return this.config.get(key);
  }

  public getString(key: SettingsKey): string | undefined {
    const value = this.get(key);

    return typeof value === "string" ? value : undefined;
  }

  public getBoolean(key: SettingsKey): boolean | undefined {
    const value = this.get(key);

    return typeof value === "boolean" ? value : undefined;
  }

  public getArray(key: SettingsKey): string[] | undefined {
    const value = this.get(key);

    return Array.isArray(value) ? value : undefined;
  }

  public update<T>(key: SettingsKey, value: T): Thenable<void> {
    return this.config.update(key, value, true);
  }

  // helpers
  /**
   * Get the COM port to connect to.
   *
   * @returns the com device to use. If autoConnect is true, the first port is returned.
   * Otherwise the manual com device is returned.
   */
  public async getComDevice(): Promise<string | undefined> {
    // manual com device undefined if this.getBoolean(SettingsKey.autoConnect) is true
    // or if manualComDevice is undefined
    if (this.getBoolean(SettingsKey.autoConnect) === true) {
      try {
        process.env.NODE_ENV = "production";
        const ports = await PyboardRunner.getPorts(this.pythonExecutable);
        if (ports.ports.length > 0) {
          return ports.ports[0];
        }
      } catch (e) {
        // TODO: use logger
        console.error(e);
        const message =
          typeof e === "string" ? e : e instanceof Error ? e.message : "";
        void window.showErrorMessage(
          "Error while reading (COM) ports for autoConnect: " + message
        );
      }
    }

    let manualComDevice = this.getString(SettingsKey.manualComDevice);
    if (manualComDevice === undefined || manualComDevice === "") {
      manualComDevice = undefined;
      void window.showErrorMessage(
        "autoConnect setting has been disabled (or no Pico has been " +
          "found automatically) but no manualComDevice has been set."
      );
    }

    return manualComDevice;
  }

  /**
   * Returns the absolute path to the sync folder. If the sync folder is undefined,
   * the project path is returned.
   *
   * @returns the absolute path to the sync folder
   */
  public getSyncFolderAbsPath(): string | undefined {
    const syncDir = this.getString(SettingsKey.syncFolder);
    const projectDir = getProjectPath();

    if (syncDir === undefined) {
      return projectDir;
    }

    if (projectDir === undefined) {
      // How can this ever happen??!
      return undefined;
    }

    return join(projectDir, syncDir);
  }

  /**
   * Returns the absolute path to one sync folder based on the user's selection
   * when multiple folders are configured.
   * If only one folder is configured, its absolute path is returned.
   *
   * @param actionTitle The title of the action to perform. Used in the selection dialog.
   * E.g. "Upload" or "Download".
   *
   * @returns The absolute path to one sync folder.
   */
  public async requestSyncFolder(
    actionTitle: string
  ): Promise<string | undefined> {
    const syncFolder = this.getSyncFolderAbsPath();
    const projectDir = getProjectPath();

    if (projectDir === undefined) {
      // How can this ever happen??!
      return;
    }

    let additionalSyncFolders = this.getArray(
      SettingsKey.additionalSyncFolders
    )?.map(sf => join(projectDir, sf));

    if (
      additionalSyncFolders === undefined ||
      additionalSyncFolders.length === 0
    ) {
      return syncFolder;
    }

    // prepend normal syncFolder if available to options
    if (
      syncFolder !== undefined &&
      !additionalSyncFolders.includes(syncFolder)
    ) {
      additionalSyncFolders = [syncFolder, ...additionalSyncFolders];
    }

    const selectedFolder = await window.showQuickPick(additionalSyncFolders, {
      placeHolder:
        `Select a sync folder to ${actionTitle.toLowerCase()} ` +
        "(add more in settings)",
      canPickMany: false,
      ignoreFocusOut: false,
      title: `${actionTitle} sync folder selection`,
    });

    return selectedFolder;
  }

  /**
   * Returns the file types to sync.
   * If syncAllFileTypes is false and syncFileTypes is undefined, an
   * empty array is returned => do sync all file types.
   *
   * @returns the file types to sync. If syncAllFileTypes is true, an
   * empty array is returned. Otherwise the syncFileTypes array is returned.
   */
  public getSyncFileTypes(): string[] {
    return this.getBoolean(SettingsKey.syncAllFileTypes)
      ? []
      : this.getArray(SettingsKey.syncFileTypes) || [];
  }

  public getIngoredSyncItems(): string[] {
    return this.getArray(SettingsKey.pyIgnore) || [];
  }
}

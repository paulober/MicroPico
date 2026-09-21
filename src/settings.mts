import type {
  Disposable,
  Memento,
  Uri,
  WorkspaceConfiguration,
} from "vscode";
import { l10n, window, workspace as vsWorkspace } from "vscode";
import { extName, getProjectPath, settingsStubsBasePath } from "./api.mjs";
import { dirname, join, relative } from "path";
import { PicoMpyCom, type VidPidPair } from "@paulober/pico-mpy-com";
import { searchFile } from "./osHelper.mjs";
import Logger from "./logger.mjs";

const logger = new Logger("Settings");

export enum SettingsKey {
  autoConnect = "autoConnect",
  manualComDevice = "manualComDevice",
  customVidPidPairs = "customVidPidPairs",
  syncFolder = "syncFolder",
  additionalSyncFolders = "additionalSyncFolders",
  syncAllFileTypes = "syncAllFileTypes",
  syncFileTypes = "syncFileTypes",
  pyIgnore = "pyIgnore",
  openOnStart = "openOnStart",
  statusbarButtons = "statusbarButtons",
  gcBeforeUpload = "gcBeforeUpload",
  softResetAfterUpload = "softResetAfterUpload",
  executeOnConnect = "executeOnConnect",
  importOnConnect = "importOnConnect",
  noSoftResetOnRun = "noSoftResetOnRun",
  disableRunFileTypeWarning = "disableRunFileTypeWarning",
  alwaysStopRunningProgram = "alwaysStopRunningProgram",
}

export type Setting = string | boolean | string[] | null | undefined;

export default class Settings {
  private config: WorkspaceConfiguration;
  private pythonConfig: WorkspaceConfiguration;
  public context: Memento;

  constructor(context: Memento) {
    this.config = vsWorkspace.getConfiguration(extName);
    this.pythonConfig = vsWorkspace.getConfiguration("python.analysis");

    this.context = context;
  }

  public reload(): void {
    this.config = vsWorkspace.getConfiguration(extName);
  }

  /**
   * Reloads the cached configuration whenever the user changes a setting, so
   * changes take effect without reloading the window.
   */
  public watch(): Disposable {
    return vsWorkspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration(extName)) {
        this.reload();
      }
      if (event.affectsConfiguration("python.analysis")) {
        this.reloadPython();
      }
    });
  }

  public reloadPython(): void {
    this.pythonConfig = vsWorkspace.getConfiguration("python.analysis");
  }

  public get(key: SettingsKey | string): Setting {
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

  public getArrayPython(key: string): string[] | undefined {
    const value = this.pythonConfig.get(key);

    return Array.isArray(value) ? value : undefined;
  }

  public getCustomVidPidPairs(): VidPidPair[] | undefined {
    const value: unknown = this.get(SettingsKey.customVidPidPairs);
    if (!Array.isArray(value)) {
      return undefined;
    }

    // Validate and filter the array
    return (value as unknown[]).filter(
      (pair): pair is VidPidPair =>
        typeof pair === "object" &&
        pair !== null &&
        typeof (pair as VidPidPair).vid === "number" &&
        typeof (pair as VidPidPair).pid === "number",
    );
  }

  public async update<T>(key: SettingsKey | string, value: T): Promise<void> {
    await this.config.update(key, value, true);
    // the cached configuration is a snapshot and would still return the old value
    this.reload();
  }

  public updateWorkspaceFolder<T>(key: string, value: T): Thenable<void> {
    return this.config.update(key, value, null);
  }

  public updatePython<T>(key: string, value: T): Thenable<void> {
    return this.pythonConfig.update(key, value, null);
  }

  // helpers
  /**
   * Get the COM port to connect to: the manually set one if there is one,
   * otherwise the first detected board when autoConnect is enabled.
   *
   * @param silent Don't show an error if reading the ports fails.
   * @returns The port, or undefined if there is nothing to connect to.
   */
  public async getComDevice(silent = false): Promise<string | undefined> {
    // a manually set port always wins, it is used without any USB ID check
    const manual = this.getString(SettingsKey.manualComDevice);
    if (manual !== undefined && manual !== "") {
      return manual;
    }

    if (this.getBoolean(SettingsKey.autoConnect) === true) {
      try {
        // process.env.NODE_ENV = "production";
        const customVidPidPairs = this.getCustomVidPidPairs();
        const ports = await PicoMpyCom.getSerialPorts(customVidPidPairs);
        if (ports.length > 0) {
          return ports[0];
        }
      } catch (e) {
        logger.error(e instanceof Error ? e.message : String(e));
        if (!silent) {
          const message =
            typeof e === "string" ? e : e instanceof Error ? e.message : "";
          void window.showErrorMessage(
            l10n.t(
              "Error while reading (COM) ports for autoConnect: {0}",
              message,
            ),
          );
        }
      }
    }

    return undefined;
  }

  /**
   * Returns the absolute path to the sync folder. If the sync folder is undefined,
   * the project path is returned.
   *
   * @returns The absolute path to the sync folder and if the setting is undefined
   */
  public getSyncFolderAbsPath(): [string | undefined, boolean] {
    const syncDir = this.getString(SettingsKey.syncFolder);
    const projectDir = getProjectPath();

    if (syncDir === undefined || syncDir.length === 0) {
      return [projectDir, true];
    }

    if (projectDir === undefined) {
      // How can this ever happen??!
      return [undefined, false];
    }

    return [join(projectDir, syncDir), false];
  }

  /**
   * Returns the absolute path to one sync folder based on the user's selection
   * when multiple folders are configured.
   * If only one folder is configured, its absolute path is returned.
   *
   * @param actionTitle The title of the action to perform. Used in the selection dialog.
   * E.g. "Upload" or "Download".
   *
   * @returns [Relative to workspace root path of one sync folder,
   * The absolute path to one sync folder]
   */
  public async requestSyncFolder(
    actionTitle: "Upload" | "Download",
  ): Promise<[string, string] | undefined> {
    // eslint-disable-next-line prefer-const
    let [syncFolder, syncSettingNotSet] = this.getSyncFolderAbsPath();
    const projectDir = getProjectPath();

    if (projectDir === undefined) {
      // How can this ever happen??!
      return;
    }

    // sync folder setting not set
    if (syncSettingNotSet) {
      const activationFile = searchFile(projectDir, ".micropico");
      const actParent = activationFile ? dirname(activationFile) : undefined;

      // check if activation file is not in project root
      if (activationFile && actParent && actParent !== projectDir) {
        syncFolder = actParent;

        // update transparent to the user
        await this.updateWorkspaceFolder(
          SettingsKey.syncFolder,
          relative(projectDir, actParent),
        );

        void window.showWarningMessage(
          l10n.t(
            "Sync folder has been set to `{0}` because the `.micropico` file was found in a subdirectory and no sync folder was set. To disable this behavior, set a sync folder in the settings to `.` for the project root.",
            relative(projectDir, actParent),
          ),
        );
      }
    }

    let additionalSyncFolders = this.getArray(
      SettingsKey.additionalSyncFolders,
    )?.map(sf => join(projectDir, sf));

    if (
      additionalSyncFolders === undefined ||
      additionalSyncFolders.length === 0
    ) {
      if (syncFolder === undefined) {
        return undefined;
      } else {
        return [relative(projectDir, syncFolder), syncFolder];
      }
    }

    // prepend normal syncFolder if available to options
    if (
      syncFolder !== undefined &&
      !additionalSyncFolders.includes(syncFolder)
    ) {
      additionalSyncFolders = [syncFolder, ...additionalSyncFolders];
    }

    const isUpload = actionTitle === "Upload";
    const selectedFolder = await window.showQuickPick(additionalSyncFolders, {
      placeHolder: isUpload
        ? l10n.t("Select a sync folder to upload (add more in settings)")
        : l10n.t("Select a sync folder to download (add more in settings)"),
      canPickMany: false,
      ignoreFocusOut: false,
      title: isUpload
        ? l10n.t("Upload sync folder selection")
        : l10n.t("Download sync folder selection"),
    });

    return selectedFolder === undefined
      ? undefined
      : [relative(projectDir, selectedFolder), selectedFolder];
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
      : (this.getArray(SettingsKey.syncFileTypes) ?? []);
  }

  public getIngoredSyncItems(): string[] {
    return this.getArray(SettingsKey.pyIgnore) ?? [];
  }

  public async updateStubsPath(newStubs: string): Promise<boolean> {
    // catch if stubs where updated before after starting the extension
    this.reloadPython();

    const typeshedPaths = this.getArrayPython("typeshedPaths");
    const extraPaths = this.getArrayPython("extraPaths");

    if (typeshedPaths === undefined || extraPaths === undefined) {
      return false;
    }

    // Remove paths starting with '~/.micropico-stubs'
    const filteredTypeshedPaths = typeshedPaths.filter(
      path =>
        !path.startsWith(settingsStubsBasePath()) &&
        !path.includes("Pico-W-Stub"),
    );
    const filteredExtraPaths = extraPaths.filter(
      path =>
        !path.startsWith(settingsStubsBasePath()) &&
        !path.includes("Pico-W-Stub"),
    );

    // Add newStubs to both arrays
    filteredTypeshedPaths.push(newStubs);
    filteredExtraPaths.push(newStubs);

    // Update the settings with the modified arrays
    await this.updatePython("typeshedPaths", filteredTypeshedPaths);
    await this.updatePython("extraPaths", filteredExtraPaths);

    return true;
  }

  public getSelectedStubsVersion(): string | undefined {
    const typeshedPaths = this.getArrayPython("typeshedPaths");
    const extraPaths = this.getArrayPython("extraPaths");

    if (typeshedPaths === undefined && extraPaths === undefined) {
      return;
    }

    let typeshedStubsPath = typeshedPaths?.find(path =>
      path.includes(settingsStubsBasePath()),
    );
    typeshedStubsPath ??= extraPaths?.find(path =>
      path.includes(settingsStubsBasePath()),
    );
    const version = typeshedStubsPath?.split("/").pop();

    return version;
  }
}

/**
 * Resolve vscode variables like ${workspaceFolder} in the given value.
 *
 * @param value Input
 * @param workspace The current workspace
 * @returns The resolved value
 */
export function resolveVariables(value: string[], workspace?: Uri): string[] {
  const substitutions = new Map<string, string>();
  const home = process.env.HOME ?? process.env.USERPROFILE;
  if (home) {
    substitutions.set("${userHome}", home);
  }
  if (workspace) {
    substitutions.set("${workspaceFolder}", workspace.fsPath);
  }
  substitutions.set("${cwd}", process.cwd());
  (vsWorkspace.workspaceFolders ?? []).forEach(w => {
    substitutions.set("${workspaceFolder:" + w.name + "}", w.uri.fsPath);
  });

  return value.map(s => {
    for (const [key, value] of substitutions) {
      s = s.replace(key, value);
    }

    return s;
  });
}

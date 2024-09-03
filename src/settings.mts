import type { Memento, Uri, WorkspaceConfiguration } from "vscode";
import { window, workspace as vsWorkspace } from "vscode";
import { extName, getProjectPath, settingsStubsBasePath } from "./api.mjs";
import { join, relative } from "path";
import { PicoMpyCom } from "@paulober/pico-mpy-com";

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
  executeOnConnect = "executeOnConnect",
  importOnConnect = "importOnConnect",
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

  public update<T>(key: SettingsKey | string, value: T): Thenable<void> {
    return this.config.update(key, value, true);
  }

  public updatePython<T>(key: string, value: T): Thenable<void> {
    return this.pythonConfig.update(key, value, null);
  }

  // helpers
  /**
   * Get the COM port to connect to.
   *
   * @returns the com device to use. If autoConnect is true, the first port is returned.
   * Otherwise the manual com device is returned.
   */
  public async getComDevice(silent = false): Promise<string | undefined> {
    // manual com device undefined if this.getBoolean(SettingsKey.autoConnect) is true
    // or if manualComDevice is undefined
    if (this.getBoolean(SettingsKey.autoConnect) === true) {
      try {
        // process.env.NODE_ENV = "production";
        const ports = await PicoMpyCom.getSerialPorts();
        if (ports.length > 0) {
          return ports[0];
        }
      } catch (e) {
        // TODO: use logger
        console.error(e);
        if (!silent) {
          const message =
            typeof e === "string" ? e : e instanceof Error ? e.message : "";
          void window.showErrorMessage(
            "Error while reading (COM) ports for autoConnect: " + message
          );
        }
      }
    }

    let manualComDevice = this.getString(SettingsKey.manualComDevice);
    if (!silent && (manualComDevice === undefined || manualComDevice === "")) {
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
   * @returns [Relative to workspace root path of one sync folder,
   * The absolute path to one sync folder]
   */
  public async requestSyncFolder(
    actionTitle: string
  ): Promise<[string, string] | undefined> {
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

    const selectedFolder = await window.showQuickPick(additionalSyncFolders, {
      placeHolder:
        `Select a sync folder to ${actionTitle.toLowerCase()} ` +
        "(add more in settings)",
      canPickMany: false,
      ignoreFocusOut: false,
      title: `${actionTitle} sync folder selection`,
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
      : this.getArray(SettingsKey.syncFileTypes) ?? [];
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
        !path.includes("Pico-W-Stub")
    );
    const filteredExtraPaths = extraPaths.filter(
      path =>
        !path.startsWith(settingsStubsBasePath()) &&
        !path.includes("Pico-W-Stub")
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
      path.includes(settingsStubsBasePath())
    );
    if (typeshedStubsPath === undefined) {
      typeshedStubsPath = extraPaths?.find(path =>
        path.includes(settingsStubsBasePath())
      );
    }
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

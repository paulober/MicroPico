import EventEmitter = require('events');
import {
  Memento,
  Uri,
  window,
  workspace,
  WorkspaceConfiguration,
} from 'vscode';
import ApiWrapper from './apiWrapper';
import Config, { Constants } from './config';

export enum SettingsKey {
  autoConnect = 'autoConnect',
  manualComDevice = 'manualComDevice',
  syncFolder = 'syncFolder',
  syncAllFileTypes = 'syncAllFileTypes',
  syncFileTypes = 'syncFileTypes',
  pyIgnore = 'pyIgnore',
  ctrlCOnConnect = 'ctrlCOnConnect',
  openOnStart = 'openOnStart',
  statusbarButtons = 'statusbarButtons',
  safeBootOnUpload = 'safeBootOnUpload',
  rebootAfterUpload = 'rebootAfterUpload',
  fastUpload = 'fastUpload',
  autoconnectComportManufacturers = 'autoconnectComportManufacturers',
  ftpPassword = 'ftpPassword',
  pythonPath = 'pythonPath',
}

export type SettingsType = string | string[] | boolean | undefined;
export type ChangeWatcherCallback = (oldValue: SettingsType, value: SettingsType) => Promise<void>;

export default class SettingsWrapper extends EventEmitter {
  private config: WorkspaceConfiguration;
  public api: ApiWrapper;
  public detectedPythonPath?: string;
  public timeout: number = 15000; // 15 seconds for connecting to serial port
  public address: string = '192.168.4.1';
  public username: string = '';
  public password: string = '';
  public uploadChunkSize: number = 0;
  public context?: Memento;
  public projectPath: string | null = null;
  private workspaceSettingsFile?: string;
  private changeWatcher: { [key: string]: ChangeWatcherCallback } = {};
  private constants: Constants = Config.constants();

  constructor(context?: Memento) {
    super();

    this.context = context;
    this.config = workspace.getConfiguration('picowgo');
    this.api = new ApiWrapper();

    this.uploadChunkSize = this.getUploadChunkSize();
  }

  public get(key: SettingsKey): SettingsType {
    return this.config.get(key);
  }

  public getProjectPath(): string | null {
    this.projectPath = this.api.getProjectPath();
    this.workspaceSettingsFile = this.projectPath + '/.vscode/settings.json';
    return this.projectPath;
  }

  public async openProjectSettings() {
    if (this.getProjectPath() && this.workspaceSettingsFile !== undefined) {
      let uri = Uri.file(this.workspaceSettingsFile!);

      let textDoc = await workspace.openTextDocument(uri);
      await window.showTextDocument(textDoc);
    } else {
      throw new Error('No project open');
    }
  }

  public getAllowedFileTypes() {
    let types: string | string[] = [];
    if (this.get(SettingsKey.syncFileTypes)) {
      // TODO: maybe implement setting as array into vscode
      types = this.get(SettingsKey.syncFileTypes) as string;
      if (typeof types === 'string') {
        types = types.split(',');
      }
      for (let i = 0; i < types.length; i++) {
        types[i] = types[i].trim();
      }
    }
    return types;
  }

  private getUploadChunkSize(): number {
    let size = this.constants.uploadBatchSize;
    if ((this.get(SettingsKey.fastUpload) as boolean)) {
      size *= this.constants.fastUploadBatchMultiplier;
    }
    return size;
  }

  /**
   * @deprecated Not needed anymore
   */
  public async refresh(): Promise<void> {
    // Deprecated, not needed anymore because settings moved to vscode and each read is from vscode
    // and not from memory where the file has to be reloaded to check for changes
  }

  /*private triggerGlobalChangeWatchers(): void {
    let keys = Object.keys(this.config);
    for (let i = 0; i < keys.length; i++) {
      let k = keys[i];
      if (this.api.config(k) !== this[k] && this.changeWatcher[k]) {
        let old = this[k];
        this[k] = this.api.config(k);
        this.changeWatcher[k](old, this.api.config(k));
      }
    }
  }*/

  // TODO: implement change watchers for settings
  public onChange(
    key: string,
    cb: ChangeWatcherCallback
  ): void {
    this.changeWatcher[key] = cb;
  }

  /* not needed since new vscode settings are used and not the json files
  private getDefaultConfig(global: boolean = false) {
    let config: { [key: string]: any } = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'picowgo.syncFolder': this.get(SettingsKey.syncFolder),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'picowgo.openOnStart': global ? this.get(SettingsKey.openOnStart) : true,
    };
    if (global) {
      config['picowgo.safeBootOnUpload'] = this.get(SettingsKey.safeBootOnUpload);
      config['picowgo.statusbarButtons'] = this.get(SettingsKey.statusbarButtons);
      config['picowgo.pyIgnore'] = this.get(SettingsKey.pyIgnore);
      config['picowgo.fastUpload'] = this.get(SettingsKey.fastUpload);
      config['picowgo.syncFileTypes'] = this.get(SettingsKey.syncFileTypes);
      config['picowgo.ctrlCOnConnect'] = this.get(SettingsKey.ctrlCOnConnect);
      config['picowgo.syncAllFileTypes'] = this.get(SettingsKey.syncAllFileTypes);
      config['picowgo.autoConnect'] = this.get(SettingsKey.autoConnect);
      config['picowgo.manualComDevice'] = this.get(SettingsKey.manualComDevice);
      config['picowgo.autoconnectComportManufacturers'] = this.get(
        SettingsKey.autoconnectComportManufacturers
      );
      config['picowgo.ftpPassword'] = this.get(SettingsKey.ftpPassword);
    }
    return config;
  }*/
}

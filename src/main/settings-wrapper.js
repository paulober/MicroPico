'use babel';

import EventEmitter from 'events';
import ApiWrapper from './api-wrapper.js';
import Logger from '../helpers/logger.js';
import * as fs from 'fs';
import { promises as fsp } from 'fs';
import * as vscode from 'vscode';
import Config from '../config.js';
import Utils from '../helpers/utils.js';
import { workspace } from 'vscode';

export default class SettingsWrapper extends EventEmitter {
  constructor() {
    super();
    this.config = Config.settings();
    this.constants = Config.constants();
    this.projectConfig = {};
    this.api = new ApiWrapper(this);
    this.projectPath = this.api.getProjectPath();
    this.globalConfigFile = Utils.getConfigPath('pico-go.json');
    this.projectConfigFile = this.projectPath + '/pico-go.json';
    this.logger = new Logger('SettingsWrapper');
    this.utils = new Utils(this);
    this.projectChangeCallbacks = [];
    this.globalConfig = {};
    this.fileWatcher = {};
    this.changeWatcher = {};
    this.fileChanged = {};
    this.setFileChangedGlobal();
  }

  async initialize(workspaceContext = null) {
    this.context = workspaceContext;

    if (!await Utils.exists(this.globalConfigFile)) {
      let gc = this.getDefaultGlobalConfig();

      // Create the Code "User" folder if it doesn't already exist.
      let configFolder = Utils.getConfigPath();

      if (!await Utils.exists(configFolder))
        await fsp.mkdir(configFolder, { recursive: true });

      await fsp.writeFile(this.globalConfigFile, JSON.stringify(gc));
    }

    this.globalConfig = await this._readConfigFile(this
      .globalConfigFile, true);
    this.projectConfig = await this._readConfigFile(this.projectConfigFile,
      false);

    await this.refresh();
    await this.watchConfigFile(this.globalConfigFile);
    await this.watchConfigFile(this.projectConfigFile);

    this.upload_chunk_size = this._getUploadChunkSize();
  }

  setFileChangedGlobal() {
    this.fileChanged[this.projectConfigFile] = true;
    this.fileChanged[this.globalConfigFile] = true;
  }

  onChange(key, cb) {
    this.changeWatcher[key] = cb;
  }

  getProjectPath() {
    this.projectPath = this.api.getProjectPath();
    this.projectConfigFile = this.projectPath + '/pico-go.json';
    return this.projectPath;
  }

  _getUploadChunkSize() {
    let size = this.constants.upload_batch_size;
    if (this.fast_upload) {
      size = size * this.constants.fast_upload_batch_multiplier;
    }
    return size;
  }

  async watchConfigFile(file) {
    if (!file) {
      file = this.globalConfigFile;
    }

    this.logger.info('Watching config file ' + file);

    if (this.fileWatcher[file]) {
      this.fileWatcher[file].close();
    }

    if (await Utils.exists(file)) {
      try {
        // eslint-disable-next-line no-unused-vars
        this.fileWatcher[file] = fs.watch(file, null, async (err) => {
          this.logger.info(
            'Config file changed, refreshing settings');
          this.fileChanged[file] = true;
          // give it some time to close
          await Utils.sleep(150);
          await this.refresh();
        });
      }
      catch (err) {
        this.logger.warning('Error opening config file ');
        this.logger.warning(err);
      }
    }
  }

  async refresh() {
    await this._refreshGlobalConfig();
    await this._refreshProjectConfig();
  }

  async _refreshGlobalConfig() {
    this.logger.info('Refreshing global config');
    this.globalConfig = await this._readConfigFile(this
      .globalConfigFile);

    this._triggerGlobalChangeWatchers();

    this.address = '192.168.4.1';
    this.sync_folder = this.api.config('sync_folder');
    this.sync_file_types = this.api.config('sync_file_types');
    this.sync_all_file_types = this.api.config('sync_all_file_types');

    this.ctrl_c_on_connect = this.api.config('ctrl_c_on_connect');
    this.open_on_start = this.api.config('open_on_start');
    this.safe_boot_on_upload = this.api.config('safe_boot_on_upload');
    this.statusbar_buttons = this.api.config('statusbar_buttons');
    this.reboot_after_upload = this.api.config('reboot_after_upload');

    this.auto_connect = this.api.config('auto_connect');
    this.manual_com_device = this.api.config('manual_com_device');
    this.py_ignore = this.api.config('py_ignore');
    this.fast_upload = this.api.config('fast_upload');
    this.autoconnect_comport_manufacturers = this.api.config(
      'autoconnect_comport_manufacturers');
    this.ftp_password = this.api.config('ftp_password');

    this.timeout = 15000;
    this._setProjectConfig();

    if (this.statusbar_buttons == undefined || this.statusbar_buttons == '') {
      this.statusbar_buttons = ['status', 'connect', 'upload', 'download',
        'run', 'softreset'
      ];
    }
    this.statusbar_buttons.push('global_settings');
    this.statusbar_buttons.push('project_settings');

    if (!this.py_ignore) {
      this.py_ignore = [];
      this.py_ignore.push(this.constants.compressed_files_folder);
    }

    // This is where it used to check if it was a serial port or an IP address.
  }

  _triggerGlobalChangeWatchers() {
    let keys = Object.keys(this.config);
    for (let i = 0; i < keys.length; i++) {
      let k = keys[i];
      if (this.api.config(k) != this[k] && this.changeWatcher[k]) {
        let old = this[k];
        this[k] = this.api.config(k);
        this.changeWatcher[k](old, this.api.config(k));
      }
    }
  }

  getAllowedFileTypes() {
    let types = [];
    if (this.sync_file_types) {
      types = this.sync_file_types;
      if (typeof types === 'string') {
        types = types.split(',');
      }
      for (let i = 0; i < types.length; i++) {
        types[i] = types[i].trim();
      }
    }
    return types;
  }

  async _checkConfigComplete(path, contents) {
    if (!this._isConfigComplete(contents)) {
      contents = this._completeConfig(contents);
      let json =
        JSON.stringify(contents, null, '\t');

      await fsp.writeFile(path, json);
      return json;
    }

    return null;
  }

  async _readConfigFile(path, checkComplete = false) {
    let contents = {};
    try {
      if (await Utils.exists('' + path)) {
        contents = await fsp.readFile(path, { encoding: 'utf-8' });
        contents = JSON.parse(contents);

        if (checkComplete) {
          await this._checkConfigComplete(path, contents);
          await this.watchConfigFile(path);
        }
      }
    }
    catch (e) {
      this.logger.warning('Error processing Config file:' + path);
      if (e instanceof SyntaxError && this.fileChanged[path]) {
        this.emit('format_error.project');
        this.fileChanged[path] = false;
      }
      contents = {};
    }
    return contents;
  }

  async _refreshProjectConfig() {
    this.logger.info('Refreshing project config');
    this.projectConfig = {};
    this.projectPath = this.api.getProjectPath();
    this.projectConfigFile = this.projectPath + '/pico-go.json';

    try {
      let contents = await this._readConfigFile(this.projectConfigFile);
      if (contents) {
        this.logger.silly('Found contents');
        this.projectConfig = contents;
        this._setProjectConfig();
      }
    }
    catch (e) {
      this.logger.info('No project config present');
      return null;
    }
  }

  _setProjectConfig() {
    // these projects settings override the global settings 
    if ('sync_folder' in this.projectConfig) {
      this.sync_folder = this.projectConfig.sync_folder;
    }
    if ('sync_file_types' in this.projectConfig) {
      this.sync_file_types = this.projectConfig.sync_file_types;
    }
    if ('ctrl_c_on_connect' in this.projectConfig) {
      this.ctrl_c_on_connect = this.projectConfig.ctrl_c_on_connect;
    }
    if ('open_on_start' in this.projectConfig) {
      this.open_on_start = this.projectConfig.open_on_start;
    }
    if ('safe_boot_on_upload' in this.projectConfig) {
      this.safe_boot_on_upload = this.projectConfig.safe_boot_on_upload;
    }
    if ('statusbar_buttons' in this.projectConfig) {
      this.statusbar_buttons = this.projectConfig.statusbar_buttons;
    }
    if ('reboot_after_upload' in this.projectConfig) {
      this.reboot_after_upload = this.projectConfig.reboot_after_upload;
    }
    if ('py_ignore' in this.projectConfig) {
      this.py_ignore = this.projectConfig.py_ignore;
    }
    if ('fast_upload' in this.projectConfig) {
      this.fast_upload = this.projectConfig.fast_upload;
    }
    if ('manual_com_device' in this.projectConfig) {
      this.manual_com_device = this.projectConfig.manual_com_device;
    }
  }

  _isConfigComplete(settingsObject) {
    return Object.keys(settingsObject).length >= Object.keys(this
      .getDefaultGlobalConfig()).length;
  }

  _completeConfig(settingsObject) {
    let defaultConfig = this.getDefaultGlobalConfig();
    if (Object.keys(settingsObject).length < Object.keys(defaultConfig)
      .length) {
      for (let k in defaultConfig) {
        if (settingsObject[k] === undefined) {
          settingsObject[k] = defaultConfig[k];
        }
      }
    }
    return settingsObject;
  }

  _getDefaultProjectConfig() {
    return this._getDefaultConfig(false);
  }

  getDefaultGlobalConfig() {
    return this._getDefaultConfig(true);
  }

  _getDefaultConfig(global = false) {
    let config = {
      'sync_folder': this.api.config('sync_folder'),
      'open_on_start': global ? this.api.config('open_on_start') : true
    };
    if (global) {
      config.safe_boot_on_upload = this.api.config('safe_boot_on_upload');
      config.statusbar_buttons = this.api.config('statusbar_buttons');
      config.py_ignore = this.api.config('py_ignore');
      config.fast_upload = this.api.config('fast_upload');
      config.sync_file_types = this.api.config('sync_file_types');
      config.ctrl_c_on_connect = this.api.config('ctrl_c_on_connect');
      config.sync_all_file_types = this.api.config('sync_all_file_types');
      config.auto_connect = this.api.config('auto_connect');
      config.manual_com_device = this.api.config('manual_com_device');
      config.autoconnect_comport_manufacturers = this.api.config(
        'autoconnect_comport_manufacturers');
      config.ftp_password = this.api.config('ftp_password');
    }
    return config;
  }

  async openProjectSettings() {
    if (this.getProjectPath()) {
      await this.createProjectSettings();

      let uri = vscode.Uri.file(this.projectConfigFile);
      
      let textDoc = await workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(textDoc);
    }
    else {
      throw new Error('No project open');
    }
  }

  async createProjectSettings() {
    if (!await Utils.exists(this.projectConfigFile)) {
      let json = this._newProjectSettingsJson();

      await fsp.writeFile(this.projectConfigFile, json);
      await this.watchConfigFile(this.projectConfigFile);
    }
  }

  _newProjectSettingsJson() {
    let settings = this._getDefaultProjectConfig();
    let json = JSON.stringify(settings, null, 4);
    return json;
  }
}
'use babel';

import { promises as fsp } from 'fs';
import * as vscode from 'vscode';
import * as ncp from 'copy-paste';
import utils from '../helpers/utils.js';
import { window, workspace } from 'vscode';
import Config from '../config.js';

export default class ApiWrapper {
  constructor(settings) {
    this.defaultConfig = Config.settings();
    this.settings = settings;
    this.first_time_opening = false;
    this.configFile = utils.getConfigPath('pico-w-go.json');
    this.isWindows = process.platform == 'win32';
    this.projectPath = this.getProjectPath();
    this.connectionStateFilename = 'connection_state.json';
  }

  config(key) {
    if (this.settings.globalConfig[key] !== undefined) {
      return this.settings.globalConfig[key];
    }
    else if (this.defaultConfig[key] !== undefined) {
      return this.defaultConfig[key].default;
    }
    else {
      return null;
    }
  }

  async openSettings() {
    if (!this.configFile) {
      throw new Error('No config file found');
    }

    if (!await this.settingsExist()) {
      // Create settings file
      let defaultConfig = this.settings.getDefaultGlobalConfig();
      let json = JSON.stringify(defaultConfig, null, '\t');

      await fsp.writeFile(this.configFile, json);
      await this.settings.watchConfigFile(this.configFile);
    }

    let uri = vscode.Uri.file(this.configFile);
    let textDoc = await vscode.workspace.openTextDocument(uri);
    vscode.window.showTextDocument(textDoc);
  }

  async settingsExist() {
    if (this.configFile) {
      return await utils.exists(this.configFile);
    }
    return false;
  }

  // It's not happy proimisifying this!
  writeToClipboard(text){
    ncp.copy(text,function(){
      // completed
    });
  }

  getPackagePath() {
    if (this.isWindows) {
      return utils.normalize(__dirname).replace('/lib/main', '/').replace(
        /\//g, '\\');
    }
    else {
      return __dirname.replace('/lib/main', '/');
    }
  }

  async getConnectionState(com) {
    let state = await this._getConnectionStateContents();
    if (!state) return state;
    return state[com];
  }

  _getConnectionStatePath() {
    return this.getPackagePath();
  }

  async _getConnectionStateContents() {
    let folder = this._getConnectionStatePath();
    try {
      return JSON.parse(await fsp.readFile(folder + this
        .connectionStateFilename));
    }
    catch (e) {
      console.log(e);
      return {};
    }
  }

  async setConnectionState(com, state, project_name) {
    let folder = this._getConnectionStatePath();
    let timestamp = new Date().getTime();
    let stateObject = await this._getConnectionStateContents();

    if (state) {
      stateObject[com] = { timestamp: timestamp, project: project_name };
    }
    else if (stateObject[com]) {
      delete stateObject[com];
    }

    await fsp.writeFile(folder + '/connection_state.json', JSON.stringify(
      stateObject));
  }

  error(text) {
    window.showErrorMessage(text);
  }

  async confirm(text, options) {
   return await window.showWarningMessage(text, ...options);
  }

  getProjectPath() {
    return this._rootPath();
  }

  _rootPath() {
    // TODO: multi-workspace folders
    // https://github.com/microsoft/vscode/wiki/Adopting-Multi-Root-Workspace-APIs#eliminating-rootpath
    let path = workspace.rootPath;
    if (path && path != '') {
      if (this.isWindows) {
        path = path.replace(/\//g, '\\');
      }
      return path;
    }
    return null;
  }

  async openFile(filename) {
    let uri = vscode.Uri.file(filename);
    let textDoc = await workspace.openTextDocument(uri);
    vscode.window.showTextDocument(textDoc);
  }

  _notification(text, type) {
    if (type == 'warning') {
      vscode.window.showWarningMessage(text);
    }
    else if (type == 'info') {
      vscode.window.showInformationMessage(text);
    }
    else if (type == 'error') {
      vscode.window.showErrorMessage(text);
    }
  }

  error(text) {
    this._notification(text, 'error');
  }
  
  warning(text) {
    this._notification(text, 'warning');
  }

  getOpenFile() {
    let editor = window.activeTextEditor;

    if (editor == undefined)
      return null;

    let doc = editor.document;
    let name = doc.fileName;
    return {
      content: doc.getText(),
      path: name
    };
  }

  getSelected() {
    let editor = window.activeTextEditor;

    if (editor == undefined)
      return null;

    let selection = editor.selection;
    let codesnip = '';
    if (!selection.isEmpty) {
      //no active selection , get the current line 
      return editor.document.getText(selection);
    }
    return codesnip;
  }

  getSelectedOrLine() {
    let code = this.getSelected();

    if (!code) {
      let editor = window.activeTextEditor;
      let selection = editor.selection;
      // the Active Selection object gives you the (0 based) line  and character where the cursor is 
      code = editor.document.lineAt(selection.active.line).text;
    }
    return code;
  }

  // restore the focus to the Editor after running a section of code
  editorFocus() {
    vscode.commands.executeCommand('workbench.action.focusPreviousGroup');
  }

}
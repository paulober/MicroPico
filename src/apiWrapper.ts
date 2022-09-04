import { promises as fsp } from 'fs';
import path from 'path';
import { commands, window, workspace } from 'vscode';
import Utils from './utils';

export type ConnectionState = { timestamp: number; project: string };

// wrapper for vscode api
export default class ApiWrapper {
  private isWindows: boolean;
  private connectionStateFilename: string = 'connection_state.json';

  constructor() {
    this.isWindows = process.platform === 'win32';
  }

  public openSettings(): void {
    // await workspace.openTextDocument(Uri.parse('vscode://settings/picowgo'));
    commands.executeCommand( 'workbench.action.openSettings', 'pico-w-go' );
  }

  public getPackagePath(): string {
    if (this.isWindows) {
      return Utils.normalize(path.join(__dirname, ".."))
        .replace('/lib/main', '/')
        .replace(/\//g, '\\');
    } else {
      return __dirname.replace('/lib/main', '/');
    }
  }

  public getProjectPath(): string | null {
    return this.rootPath();
  }

  private rootPath(): string | null {
    // TODO: multi-workspace folders
    // https://github.com/microsoft/vscode/wiki/Adopting-Multi-Root-Workspace-APIs#eliminating-rootpath
    let path = workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (path && path !== '') {
      if (this.isWindows) {
        path = path.replace(/\//g, '\\');
      }
      return path;
    }
    return null;
  }

  public async getConnectionState(com: string): Promise<ConnectionState> {
    let state = await this.getConnectionStateContents();
    if (!state) {
      return state;
    }
    return state[com];
  }

  private getConnectionStatePath() {
    return this.getPackagePath();
  }

  private async getConnectionStateContents(): Promise<{
    [key: string]: ConnectionState;
  }> {
    let folder = this.getConnectionStatePath();
    try {
      return JSON.parse(
        await fsp.readFile(folder + '/' + this.connectionStateFilename, 'utf8')
      );
    } catch (e) {
      // TODO: maybe stop printing this error because it should 
      // appear if the file does not exist which is not a problem
      // only relevant if file would exist but it is unable to read it
      console.log(e);
      return {};
    }
  }

  /**
   * Saves the current connection state to the connection_state.json file.
   * 
   * @param com The connection address.
   * @param state The conntection state to set.
   * @param projectName Has to be provided if the state is set to `true`.
   */
  public async setConnectionState(
    com: string,
    state: boolean,
    projectName?: string
  ): Promise<void> {
    let folder = this.getConnectionStatePath();
    let timestamp = new Date().getTime();
    let stateObject = await this.getConnectionStateContents();

    // if project state is false, porjectName does not have to be parsed
    // if state is true, projectName has to be parsed
    if (state && projectName) {
      stateObject[com] = { timestamp: timestamp, project: projectName! };
    } else if (stateObject[com]) {
      delete stateObject[com];
    }

    await fsp.writeFile(
      folder + '/connection_state.json',
      JSON.stringify(stateObject)
    );
  }

  /**
   * @returns {Promise<boolean>}
   */
  public async settingsExist(): Promise<boolean> {
    return true;
  }

  public async writeToClipboard(content: string) {
    // not implemented
  }

  private notification(text: string, type: string) {
    if (type === 'warning') {
      window.showWarningMessage(text);
    } else if (type === 'info') {
      window.showInformationMessage(text);
    } else if (type === 'error') {
      window.showErrorMessage(text);
    }
  }

  public error(text: string): void {
    this.notification(text, 'error');
  }

  public warning(text: string): void {
    this.notification(text, 'warning');
  }

  public async confirm(text: string, ...items: any[]) {
    return await window.showWarningMessage(text, ...items);
  }

  // restore the focus to the Editor after running a section of code
  public editorFocus(): void {
    commands.executeCommand('workbench.action.focusPreviousGroup');
  }

  public getOpenFile(): { content: string; path: string } | null {
    let editor = window.activeTextEditor;

    if (editor === undefined) {
      return null;
    }

    let doc = editor.document;
    let name = doc.fileName;
    return {
      content: doc.getText(),
      path: name,
    };
  }

  public getSelected(): string | null {
    let editor = window.activeTextEditor;

    if (editor === undefined) {
      return null;
    }

    let selection = editor.selection;
    let codesnip = '';
    if (!selection.isEmpty) {
      //no active selection , get the current line 
      return editor.document.getText(selection);
    }
    return codesnip;
  }

  public getSelectedOrLine(): string | null {
    let code = this.getSelected();

    if (!code) {
      let editor = window.activeTextEditor;
      let selection = editor!.selection;
      // the Active Selection object gives you the (0 based) line  and character where the cursor is 
      let text = editor?.document.lineAt(selection.active.line).text;
      if (text !== undefined) {
        code = text;
      }
    }
    return code;
  }
}

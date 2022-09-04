import * as vscode from 'vscode';
import Activator from './activator';
import PanelView from './panelView';

// as constant alternative:
// const ... vscode.extensions.getExtension("paulober.pico-w-go")?.packageJSON;
// let pkg: any;

let view: PanelView | undefined;

/**
 * Called when extension is activated
 * 
 * - activated the very first time the 'initialise'/'configure project' command is executed
 * - workspace folder contains .picowgo file
 * 
 * @param context The vscode context for this extension
 */
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // These lines of code will only be executed once when the extension is activated
  // pkg = context.extension.packageJSON;

  let activator = new Activator();
  view = await activator.activate(context);
}

// this method is called when your extension is deactivated
export function deactivate() {
  if (view !== undefined) {
    setTimeout(async () => {
      await view?.destroy();
    }, 1500);
  }
}

// https://serialport.io/docs/guide-platform-support
// TODO: this is useless because the extension will crash
// before this check is even reached if the serialport
// library is not available (does not support the kind of host platform)
// RIP: checkSerialPort() function

import * as vscode from 'vscode';
import * as os from 'os';
import * as _ from 'lodash';
import Activator from './activator';
import PanelView from './panelView';

// as constant alternative:
// const ... vscode.extensions.getExtension("paulober.pico-w-go")?.packageJSON;
let pkg: any;

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
  pkg = context.extension.packageJSON;

  if (checkSerialPort()) {
    console.log('Serialport library loaded');

    let activator = new Activator();
    view = await activator.activate(context);
  }
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
function checkSerialPort(): boolean {
  try {
    let isCompatible = false;
    // native platform support by current serialport package
    let item = _.find(pkg.compatibility, (x) => x.platform === os.platform());

    if (item !== null) {
      // check nodeVersion for compatibility based on serialport package version min supported node
      let majorNodeVersion = parseInt(process.versions.node.split('.')[0]);

      isCompatible =
        _.includes(item.arch, os.arch()) &&
        majorNodeVersion >= pkg.minimumNodeVersion;
    }

    if (!isCompatible) {
      vscode.window.showErrorMessage(
        `Sorry, Pico-W-Go currently isn't compatible with your system: ${os.platform()} (${os.arch()}).`
      );
      return false;
    }

    import('serialport');
    return true;
  } catch (e) {

    console.log('Error while loading serialport library');
    console.log(e);
  }
  return false;
}

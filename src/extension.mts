import * as vscode from "vscode";
import Activator from "./activator.mjs";
import UI from "./ui.mjs";

let view: UI | undefined;

/**
 * Called when extension is activated
 *
 * - activated the very first time the 'initialise'/'configure project' command is executed
 * - workspace folder contains .picowgo file
 *
 * @param context The vscode context for this extension
 */
export async function activate(context: vscode.ExtensionContext) {
  const activator = new Activator();
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

import type * as vscode from "vscode";
import Activator from "./activator.mjs";
import type UI from "./ui.mjs";

let view: UI | undefined;

/**
 * Called when extension is activated
 *
 * - activated the very first time the 'initialise'/'configure project' command is executed
 * - workspace folder contains .picowgo file
 *
 * @param context The vscode context for this extension
 */
export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  const activator = new Activator();
  view = await activator.activate(context);
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  if (view !== undefined) {
    setTimeout(() => {
      view?.destroy();
    }, 1500);
  }
}

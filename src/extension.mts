import { type ExtensionContext, commands } from "vscode";
import Activator from "./activator.mjs";
import type UI from "./ui.mjs";
import { ContextKeys } from "./models/contextKeys.mjs";
import { renameUtilRun } from "./extRenameUtil.mjs";

let view: UI | undefined;

/**
 * Called when extension is activated
 *
 * - activated the very first time the 'initialise'/'configure project' command is executed
 * - workspace folder contains .picowgo file
 *
 * @param context The vscode context for this extension
 */
export async function activate(context: ExtensionContext): Promise<void> {
  // execute utitlity for extension rename transition process
  await renameUtilRun();

  // activate extension
  const activator = new Activator();
  view = await activator.activate(context);
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  // execute async not await
  void commands.executeCommand("setContext", ContextKeys.isActivated, false);
  void commands.executeCommand("setContext", ContextKeys.isConnected, false);
  // destry view
  if (view !== undefined) {
    setTimeout(() => {
      view?.destroy();
    }, 1500);
  }
}

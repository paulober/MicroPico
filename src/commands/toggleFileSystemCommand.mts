import * as vscode from "vscode";
import { l10n } from "vscode";
import { Command } from "./command.mjs";

/** Adds or removes the virtual `pico://` remote workspace folder. */
export class ToggleFileSystemCommand extends Command {
  public readonly id = "toggleFileSystem";

  public execute(): void {
    const findWorkspace = vscode.workspace.workspaceFolders?.find(
      folder => folder.uri.scheme === "pico",
    );
    if (findWorkspace !== undefined) {
      // remove the existing remote workspace folder
      vscode.workspace.updateWorkspaceFolders(findWorkspace.index, 1);

      return;
    }

    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage(
        l10n.t("Please connect to the board first."),
      );

      return;
    }

    vscode.workspace.updateWorkspaceFolders(
      vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders.length
        : 0,
      null,
      {
        uri: vscode.Uri.parse("pico://"),
        name: l10n.t("Mpy Remote Workspace"),
      },
    );
  }
}

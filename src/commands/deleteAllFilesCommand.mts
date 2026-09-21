import * as vscode from "vscode";
import { l10n } from "vscode";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { Command } from "./command.mjs";

/** Deletes every file on the board by removing the filesystem root. */
export class DeleteAllFilesCommand extends Command {
  public readonly id = "deleteAllFiles";

  public async execute(): Promise<void> {
    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage(l10n.t("Please connect to the board first."));

      return;
    }

    const result = await this.ctx.com.deleteFolderRecursive("/");
    if (result.type === OperationResultType.commandResult) {
      if (result.result) {
        void vscode.window.showInformationMessage(
          l10n.t("All files on the board were deleted."),
        );
      } else {
        void vscode.window.showErrorMessage(l10n.t("File deletion on the board failed."));
      }
    }
  }
}

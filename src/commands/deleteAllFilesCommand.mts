import * as vscode from "vscode";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { Command } from "./command.mjs";

/** Deletes every file on the board by removing the filesystem root. */
export class DeleteAllFilesCommand extends Command {
  public readonly id = "deleteAllFiles";

  public async execute(): Promise<void> {
    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage("Please connect to the Pico first.");

      return;
    }

    const result = await this.ctx.com.deleteFolderRecursive("/");
    if (result.type === OperationResultType.commandResult) {
      if (result.result) {
        void vscode.window.showInformationMessage(
          "All files on Pico were deleted.",
        );
      } else {
        void vscode.window.showErrorMessage("File deletion on Pico failed.");
      }
    }
  }
}

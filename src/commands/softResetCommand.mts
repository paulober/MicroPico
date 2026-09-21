import * as vscode from "vscode";
import { l10n } from "vscode";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { Command } from "./command.mjs";

/** Soft-resets the board (clears the MicroPython VM state). */
export class SoftResetCommand extends Command {
  public readonly id = "reset.soft";

  private inProgress = false;

  public async execute(): Promise<void> {
    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage(l10n.t("Please connect to the board first."));

      return;
    }

    // repeated clicks would otherwise queue one reset each
    if (this.inProgress) {
      vscode.window.setStatusBarMessage(l10n.t("A soft reset is already in progress."), 3000);

      return;
    }

    // the reset would only run once the program ends, so ask first
    if (
      this.ctx.commandExecuting &&
      (await this.ctx.checkForRunningOperation("Reset"))
    ) {
      return;
    }

    this.inProgress = true;
    try {
      const result = await this.ctx.com.softReset();
      if (result.type === OperationResultType.commandResult && result.result) {
        this.ctx.setBackgroundProgram(false);
        void vscode.window.showInformationMessage(l10n.t("Soft reset done"));

        return;
      }

      void vscode.window.showErrorMessage(l10n.t("Soft reset failed"));
    } finally {
      this.inProgress = false;
    }
  }
}

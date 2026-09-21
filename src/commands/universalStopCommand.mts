import * as vscode from "vscode";
import { l10n } from "vscode";
import { Command } from "./command.mjs";

/**
 * Interrupts whatever operation is currently running on the board, or ends a
 * program that keeps running in the background.
 */
export class UniversalStopCommand extends Command {
  public readonly id = "universalStop";

  public async execute(): Promise<void> {
    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showInformationMessage(l10n.t("Nothing to stop."));

      return;
    }

    if (this.ctx.ui?.isUserOperationOngoing()) {
      // interrupt most running programs
      this.ctx.com.interruptExecution();

      // wait for the program to stop
      await new Promise(resolve => setTimeout(resolve, 100));

      return;
    }

    if (this.ctx.backgroundProgram) {
      if (!(await this.ctx.stopBackgroundProgram())) {
        void vscode.window.showErrorMessage(
          l10n.t("Failed to stop the program running in the background."),
        );
      }

      return;
    }

    void vscode.window.showInformationMessage(l10n.t("Nothing to stop."));
  }
}

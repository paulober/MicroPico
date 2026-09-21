import * as vscode from "vscode";
import { l10n } from "vscode";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { Command } from "./command.mjs";

/** Hard-resets the board (reboots it), warning first if a boot.py is present. */
export class HardResetCommand extends Command {
  public readonly id = "reset.hard";

  private inProgress = false;

  public async execute(): Promise<void> {
    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage(l10n.t("Please connect to the board first."));

      return;
    }

    // repeated clicks would otherwise queue one reset each
    if (this.inProgress) {
      vscode.window.setStatusBarMessage(l10n.t("A hard reset is already in progress."), 3000);

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
      if (await this.ctx.warnAboutBootPy()) {
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: l10n.t("Performing hard reset..."),
          cancellable: true,
        },
        async (progress, token) => {
          token.onCancellationRequested(() =>
            this.ctx.com.interruptExecution(),
          );

          const result = await this.ctx.com.hardReset((open: boolean) => {
            if (!open) {
              return;
            }

            this.ctx.ui?.userOperationStarted();
          });
          progress.report({ increment: 100 });
          this.ctx.ui?.userOperationStopped();
          if (result.type === OperationResultType.commandResult) {
            if (result.result) {
              this.ctx.setBackgroundProgram(false);
              void vscode.window.showInformationMessage(l10n.t("Hard reset is done."));
            } else {
              void vscode.window.showErrorMessage(l10n.t("Hard reset has failed."));
            }
          }
        },
      );
    } finally {
      this.inProgress = false;
    }
  }
}

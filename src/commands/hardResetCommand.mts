import * as vscode from "vscode";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { Command } from "./command.mjs";

/** Hard-resets the board (reboots it), warning first if a boot.py is present. */
export class HardResetCommand extends Command {
  public readonly id = "reset.hard";

  public async execute(): Promise<void> {
    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage("Please connect to the Pico first.");

      return;
    }

    if (await this.ctx.warnAboutBootPy()) {
      return;
    }

    void vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Performing hard reset...",
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
            void vscode.window.showInformationMessage("Hard reset is done.");
          } else {
            void vscode.window.showErrorMessage("Hard reset has failed.");
          }
        }
      },
    );
  }
}

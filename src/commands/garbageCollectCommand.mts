import * as vscode from "vscode";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { Command } from "./command.mjs";

/** Triggers a garbage collection on the board. */
export class GarbageCollectCommand extends Command {
  public readonly id = "garbageCollect";

  public execute(): void {
    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage("Please connect to the Pico first.");

      return;
    }

    void vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Running garbage collector...",
        cancellable: false,
      },
      async progress => {
        const result = await this.ctx.com.garbageCollect();
        progress.report({ increment: 100 });
        if (
          result.type === OperationResultType.commandResult &&
          result.result
        ) {
          void vscode.window.showInformationMessage("Garbage collection done");

          return;
        }

        void vscode.window.showErrorMessage("Garbage collection failed");
      },
    );
  }
}

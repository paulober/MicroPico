import * as vscode from "vscode";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { Command } from "./command.mjs";

/** Soft-resets the board (clears the MicroPython VM state). */
export class SoftResetCommand extends Command {
  public readonly id = "reset.soft";

  public async execute(): Promise<void> {
    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage("Please connect to the Pico first.");

      return;
    }

    const result = await this.ctx.com.softReset();
    if (result.type === OperationResultType.commandResult && result.result) {
      void vscode.window.showInformationMessage("Soft reset done");

      return;
    }

    void vscode.window.showErrorMessage("Soft reset failed");
  }
}

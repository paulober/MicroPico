import * as vscode from "vscode";
import { StringDecoder } from "string_decoder";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { focusTerminal } from "../api.mjs";
import { Command } from "./command.mjs";

/** Interactive soft reset that streams the board output into the vREPL. */
export class SoftResetListenCommand extends Command {
  public readonly id = "reset.soft.listen";

  public async execute(): Promise<void> {
    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage(
        "Please connect to the Pico first.",
      );

      return;
    }

    await focusTerminal(this.ctx.terminalOptions);
    const decoder = new StringDecoder("utf-8");
    const result = await this.ctx.com.sendCtrlD(
      (open: boolean) => {
        if (open) {
          this.ctx.commandExecuting = true;
          this.ctx.terminal?.clean(true);
          this.ctx.ui?.userOperationStarted();
        }
      },
      (data: Buffer) => {
        this.ctx.output?.route(data);
        const text = decoder.write(data); // streaming decode
        if (text.length > 0) {
          this.ctx.terminal?.write(text);
        }
      },
    );
    this.ctx.commandExecuting = false;
    this.ctx.ui?.userOperationStopped();
    if (result.type === OperationResultType.commandResult) {
      if (result.result) {
        void vscode.window.showInformationMessage(
          "Interactive Soft Reset finished",
        );
      } else {
        void vscode.window.showErrorMessage("Soft reset failed");
      }
    }
    this.ctx.terminal?.melt();
    this.ctx.terminal?.prompt(true);
  }
}

import * as vscode from "vscode";
import { StringDecoder } from "string_decoder";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { focusTerminal } from "../api.mjs";
import { Command } from "./command.mjs";

/** Interactive hard reset that streams the board output into the vREPL. */
export class HardResetListenCommand extends Command {
  public readonly id = "reset.hard.listen";

  public async execute(...args: unknown[]): Promise<void> {
    const terminalTriggered = args[0] === true;

    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage(
        "Please connect to the Pico first.",
      );

      return;
    }

    if (await this.ctx.warnAboutBootPy()) {
      if (terminalTriggered) {
        this.ctx.terminal?.clean(true);
        this.ctx.terminal?.prompt();
      }

      return;
    }

    await focusTerminal(this.ctx.terminalOptions);
    const decoder = new StringDecoder("utf-8");
    const result = await this.ctx.com.hardReset(
      (open: boolean) => {
        if (!open) {
          return;
        }

        this.ctx.commandExecuting = true;
        this.ctx.terminal?.cleanAndStore();
        this.ctx.ui?.userOperationStarted();

        // inform user about ongoing operation
        this.ctx.terminal?.write("\x1b[33mPerforming hard reset...\x1b[0m\r\n");
      },
      (data: Buffer) => {
        this.ctx.output?.route(data);
        const text = decoder.write(data); // streaming decode
        if (text.length > 0) {
          this.ctx.terminal?.write(text);
        }
      },
    );
    this.ctx.terminal?.restore();
    this.ctx.commandExecuting = false;
    this.ctx.ui?.userOperationStopped();
    if (result.type === OperationResultType.commandResult) {
      if (result.result) {
        void vscode.window.showInformationMessage("Hard reset done");
      } else {
        void vscode.window.showErrorMessage("Hard reset failed");
      }
    }
  }
}

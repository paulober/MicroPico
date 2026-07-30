import * as vscode from "vscode";
import { StringDecoder } from "string_decoder";
import { focusTerminal, getSelectedCodeOrLine } from "../api.mjs";
import { Command } from "./command.mjs";

/** Runs the current editor selection (or line) on the board in the vREPL. */
export class RunSelectionCommand extends Command {
  public readonly id = "runselection";

  public async execute(): Promise<void> {
    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage(
        "Please connect to the Pico first.",
      );

      return;
    }

    if (!this.ctx.pythonPath) {
      this.ctx.showNoActivePythonError();

      return;
    }

    const code = getSelectedCodeOrLine();
    if (code === undefined) {
      void vscode.window.showWarningMessage("No code selected.");

      return;
    }

    await focusTerminal(this.ctx.terminalOptions);
    const decoder = new StringDecoder("utf-8");
    await this.ctx.com.runFriendlyCommand(
      code,
      (open: boolean) => {
        if (!open) {
          return;
        }

        this.ctx.commandExecuting = true;
        this.ctx.terminal?.cleanAndStore();
        this.ctx.ui?.userOperationStarted();
      },
      (data: Buffer) => {
        if (data.length > 0) {
          this.ctx.output?.route(data);
          const text = decoder.write(data); // streaming decode
          if (text.length > 0) {
            this.ctx.terminal?.write(text);
          }
        }
      },
      this.ctx.pythonPath,
      true,
    );
    this.ctx.commandExecuting = false;
    this.ctx.ui?.userOperationStopped();
    this.ctx.terminal?.restore();
  }
}

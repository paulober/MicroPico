import * as vscode from "vscode";
import { l10n } from "vscode";
import { StringDecoder } from "string_decoder";
import { getSelectedCodeOrLine } from "../api.mjs";
import { Command } from "./command.mjs";

/** Runs the current editor selection (or line) on the board in the vREPL. */
export class RunSelectionCommand extends Command {
  public readonly id = "runselection";

  public async execute(): Promise<void> {
    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage(
        l10n.t("Please connect to the board first."),
      );

      return;
    }

    if (!this.ctx.pythonPath) {
      this.ctx.showNoActivePythonError();

      return;
    }

    const code = getSelectedCodeOrLine();
    if (code === undefined) {
      void vscode.window.showWarningMessage(l10n.t("No code selected."));

      return;
    }

    await this.ctx.revealTerminal();
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

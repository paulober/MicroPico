import * as vscode from "vscode";
import { Command } from "./command.mjs";

/** Interrupts whatever operation is currently running on the board. */
export class UniversalStopCommand extends Command {
  public readonly id = "universalStop";

  public async execute(): Promise<void> {
    if (
      this.ctx.com.isPortDisconnected() ||
      !this.ctx.ui?.isUserOperationOngoing()
    ) {
      void vscode.window.showInformationMessage("Nothing to stop.");

      return;
    }

    // interrupt most running programs
    this.ctx.com.interruptExecution();

    // wait for the program to stop
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

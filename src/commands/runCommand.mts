import * as vscode from "vscode";
import { extname } from "path";
import { StringDecoder } from "string_decoder";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { commandPrefix, getFocusedFile } from "../api.mjs";
import { SettingsKey } from "../settings.mjs";
import Logger from "../logger.mjs";
import { Command } from "./command.mjs";

/** Runs a local file on the board, or delegates to remote.run for board files. */
export class RunCommand extends Command {
  public readonly id = "run";

  private readonly logger = new Logger("RunCommand");

  public async execute(...args: unknown[]): Promise<void> {
    const resourceURI = args[0] as vscode.Uri | undefined;
    const noSoftReset = args[1] === true;

    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage(
        "Please connect to the Pico first.",
      );

      return;
    }

    let file = resourceURI?.fsPath ?? (await getFocusedFile());

    if (file === undefined || resourceURI?.scheme === "pico") {
      file = await getFocusedFile(true);
      if (file === undefined) {
        void vscode.window.showWarningMessage("No file open and focused.");

        return;
      } else {
        void vscode.commands.executeCommand(commandPrefix + "remote.run");

        return;
      }
    }

    const disableWarning =
      this.ctx.settings.getBoolean(SettingsKey.disableRunFileTypeWarning) ??
      false;

    if (!disableWarning && ![".py", ".mpy"].includes(extname(file))) {
      const dontShowAgain = "Yes, don't show this again";
      const choice = await vscode.window.showWarningMessage(
        "The selected file is not a Python file. " +
          "Do you still want to run it?",
        "Yes",
        "No",
        dontShowAgain,
      );

      if (choice !== "Yes" && choice !== dontShowAgain) {
        return;
      }

      if (choice === dontShowAgain) {
        await this.ctx.settings.update(
          SettingsKey.disableRunFileTypeWarning,
          true,
        );
      }
    }

    if (await this.ctx.checkForRunningOperation()) {
      return;
    }

    const forceDisableSoftReset =
      this.ctx.settings.getBoolean(SettingsKey.noSoftResetOnRun) ?? false;

    // Only reset before running: a reset afterwards would end timers,
    // interrupts and threads the program leaves running (#278).
    if (!noSoftReset && !forceDisableSoftReset) {
      await this.ctx.com.softReset();
      this.ctx.setBackgroundProgram(false);
    }
    const decoder = new StringDecoder("utf-8");
    const data = await this.ctx.com.runFile(
      file,
      (open: boolean): void => {
        if (!open) {
          return;
        }

        void this.ctx.revealTerminal();
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
    );
    this.ctx.ui?.userOperationStopped();
    if (data.type !== OperationResultType.commandResult || !data.result) {
      this.logger.warn("Failed to execute script on Pico.");
    }
    this.ctx.commandExecuting = false;
    this.ctx.terminal?.restore();
  }
}

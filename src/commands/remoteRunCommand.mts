import * as vscode from "vscode";
import { StringDecoder } from "string_decoder";
import { focusTerminal, getFocusedFile } from "../api.mjs";
import { SettingsKey } from "../settings.mjs";
import { Command } from "./command.mjs";

/**
 * Resolve an explicit run target passed to the command. A string is used as-is;
 * a `pico://` URI (e.g. from the editor/explorer context menu) contributes its
 * board path. Anything else yields undefined so the caller falls back to the
 * focused editor. Previously a URI argument was silently dropped.
 */
export function resolveRemoteRunOverride(
  fileOverride: unknown,
): string | undefined {
  if (typeof fileOverride === "string") {
    return fileOverride;
  }

  if (typeof fileOverride === "object" && fileOverride !== null) {
    const uri = fileOverride as { scheme?: unknown; path?: unknown };
    if (uri.scheme === "pico" && typeof uri.path === "string") {
      return uri.path;
    }
  }

  return undefined;
}

/** Runs a file that lives on the board (the `pico://` remote file system). */
export class RemoteRunCommand extends Command {
  public readonly id = "remote.run";

  public async execute(...args: unknown[]): Promise<void> {
    const fileOverride = args[0];
    const noSoftReset = args[1] === true;

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

    const file =
      resolveRemoteRunOverride(fileOverride) ?? (await getFocusedFile(true));

    if (file === undefined) {
      void vscode.window.showWarningMessage("No remote file open and focused.");

      return;
    }

    if (await this.ctx.checkForRunningOperation()) {
      return;
    }

    const forceDisableSoftReset =
      this.ctx.settings.getBoolean(SettingsKey.noSoftResetOnRun) ?? false;

    if (!noSoftReset && !forceDisableSoftReset) {
      await this.ctx.com.softReset();
    }
    await focusTerminal(this.ctx.terminalOptions);
    const decoder = new StringDecoder("utf-8");
    await this.ctx.com.runRemoteFile(
      file,
      (open: boolean) => {
        if (!open) {
          return;
        }

        // tells the terminal to emit input events to relay user input
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
    if (!noSoftReset && !forceDisableSoftReset) {
      await this.ctx.com.softReset();
    }
    this.ctx.ui?.userOperationStopped();
    this.ctx.commandExecuting = false;
    this.ctx.terminal?.restore();
  }
}

import * as vscode from "vscode";
import { PicoMpyCom } from "@paulober/pico-mpy-com";
import type Settings from "../settings.mjs";
import type UI from "../ui.mjs";
import type { Terminal } from "../terminal.mjs";
import type { OutputRouter } from "../output/outputRouter.mjs";

/**
 * The single home for state shared across commands and the connection manager.
 * A reference to this object is injected into every {@link Command}, so the
 * many cross-command globals that used to live as scattered activator fields
 * are centralized here and shared by reference.
 *
 * Fields are added as the corresponding commands migrate onto the class-based
 * pattern; the reassigned flags (`pythonPath`, `comDevice`, `commandExecuting`)
 * move here together with the code that writes them, so there is never a stale
 * duplicate between the activator and this context.
 */
export class SessionContext {
  /** The shared MicroPython communication singleton. */
  public readonly com = PicoMpyCom.getInstance();

  /** Set once during activation, before any command can run. */
  public ui?: UI;
  public terminal?: Terminal;
  public output?: OutputRouter;

  /** The active Python interpreter path; updated when the user switches env. */
  public pythonPath?: string;

  public constructor(public readonly settings: Settings) {}

  /**
   * Warn the user before a hard reset if a boot.py is present (it may block or
   * delay the REPL). Shared by the hard-reset commands.
   *
   * @returns `true` if the operation should be aborted, `false` to continue.
   */
  public async warnAboutBootPy(): Promise<boolean> {
    const bootPyResult = await this.com.getItemStat("/boot.py");

    // getItemStat is the only result variant carrying `stat`; a present, non-null
    // stat means boot.py exists. Checked structurally to avoid importing the
    // OperationResultType enum, which the CJS lib does not expose to node:test.
    if ("stat" in bootPyResult && bootPyResult.stat !== null) {
      const result = await vscode.window.showWarningMessage(
        "A boot.py script is present on the Pico. " +
          "If it contains an infinite loop or long running code, " +
          "the Pico may not enter the REPL or take longer to do so. " +
          "Do you want to continue?",
        { modal: true },
        "Yes",
      );

      return result !== "Yes";
    } else {
      void vscode.window.showErrorMessage(
        "Failed to retrieve details about the boot.py file.",
      );
    }

    // continue as we don't know if there is a boot.py file
    // or the user wants to continue even if there is one
    return false;
  }
}

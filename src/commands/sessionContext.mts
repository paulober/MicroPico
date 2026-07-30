import * as vscode from "vscode";
import { PicoMpyCom } from "@paulober/pico-mpy-com";
import type Settings from "../settings.mjs";
import type UI from "../ui.mjs";
import type { Terminal } from "../terminal.mjs";
import type { OutputRouter } from "../output/outputRouter.mjs";
import type { PicoRemoteFileSystem } from "../filesystem.mjs";

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
  /** Set once during activation, before any command can run. */
  public ui?: UI;
  public terminal?: Terminal;
  public terminalOptions?: vscode.ExtensionTerminalOptions;
  public output?: OutputRouter;
  public picoFs?: PicoRemoteFileSystem;

  /** The active Python interpreter path; updated when the user switches env. */
  public pythonPath?: string;

  /**
   * Whether a board operation is currently running. Shared by reference across
   * the run/reset commands (which set it) and the connection handler (which
   * clears it when the port closes mid-operation).
   */
  public commandExecuting = false;

  private statusbarMsgDisposable?: vscode.Disposable;

  public constructor(
    public readonly settings: Settings,
    /** The shared MicroPython communication singleton (injectable for tests). */
    public readonly com: PicoMpyCom = PicoMpyCom.getInstance(),
  ) {}

  /**
   * If an operation is already running, ask the user whether to cancel it.
   *
   * @returns `true` if the caller should abort (the user kept the running
   * operation), `false` to proceed.
   */
  public async checkForRunningOperation(): Promise<boolean> {
    if (this.commandExecuting) {
      const choice = await vscode.window.showWarningMessage(
        "An operation is already running. Do you want to cancel it?",
        { modal: true },
        "Yes",
        "No",
      );

      if (choice === "Yes") {
        if (this.commandExecuting) {
          this.com.interruptExecution();

          // wait for 500ms for the operation to stop and clean up local state
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } else {
        this.statusbarMsgDisposable?.dispose();
        this.statusbarMsgDisposable = vscode.window.setStatusBarMessage(
          "Operation canceled.",
          5000,
        );

        return true;
      }
    }

    return false;
  }

  /** Warn the user that no Python interpreter is selected. */
  public showNoActivePythonError(): void {
    void vscode.window
      .showWarningMessage(
        "Python path not found. Please check your Python environment.\n" +
          "See the Python extension for instructions on how to select " +
          "a Python interpreter.",
        "Open Documentation",
      )
      .then(selection => {
        if (selection?.toLocaleLowerCase().startsWith("open")) {
          void vscode.env.openExternal(
            vscode.Uri.parse(
              // eslint-disable-next-line max-len
              "https://code.visualstudio.com/docs/languages/python#_environments",
            ),
          );
        }
      });
  }

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

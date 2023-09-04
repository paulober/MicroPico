import { type ExtensionTerminalOptions, window } from "vscode";
import type StateContainer from "../stateContainer.mjs";
import type { Terminal } from "../terminal.mjs";
import { Command } from "./command.mjs";
import { focusTerminal, getFocusedFile } from "../api.mjs";
import { dirname } from "path";

export default class RemoteRunFileCommand extends Command {
  private _state: StateContainer;
  private _terminal: Terminal;
  private _terminalOptions: ExtensionTerminalOptions;

  constructor(
    state: StateContainer,
    terminal: Terminal,
    terminalOptions: ExtensionTerminalOptions
  ) {
    super("remote.run");

    this._state = state;
    this._terminal = terminal;
    this._terminalOptions = terminalOptions;
  }

  async execute(): Promise<void> {
    if (!this._state.pyb?.isPipeConnected()) {
      void window.showWarningMessage("Please connect to the Pico first.");

      return;
    }

    const file = await getFocusedFile(true);

    if (file === undefined) {
      void window.showWarningMessage("No remote file open and focused.");

      return;
    }

    let frozen = false;
    await focusTerminal(this._terminalOptions);
    await this._state.pyb.executeCommand(
      "import uos as _pico_uos; " +
        "__pico_dir=_pico_uos.getcwd(); " +
        `_pico_uos.chdir('${dirname(file)}'); ` +
        `execfile('${file}'); ` +
        "_pico_uos.chdir(__pico_dir); " +
        "del __pico_dir; " +
        "del _pico_uos",
      (data: string) => {
        // only freeze after operation has started
        if (!frozen) {
          this._state.commandExecuting = true;
          this._terminal?.clean(true);
          this._terminal?.write("\r\n");
          this._state.ui?.userOperationStarted();
          frozen = true;
        }
        if (data.length > 0) {
          this._terminal?.write(data);
        }
      },
      true
    );
    this._state.ui?.userOperationStopped();
    this._state.commandExecuting = false;
    this._terminal?.melt();
    this._terminal?.write("\r\n");
    this._terminal?.prompt();
  }
}

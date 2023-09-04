import type StateContainer from "../stateContainer.mjs";
import { Command } from "./command.mjs";

export default class RunFileCommand extends Command {
  private _state: StateContainer;

  constructor(state: StateContainer) {
    super("run");

    this._state = state;
  }

  async execute(): Promise<void> {
    clearInterval(this._state.autoConnectTimer);
    await this._state.pyb?.disconnect();
  }
}

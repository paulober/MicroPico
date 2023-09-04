import type StateContainer from "../stateContainer.mjs";
import { Command } from "./command.mjs";

export default class ConfigureCommand extends Command {
  private _state: StateContainer;

  constructor(state: StateContainer) {
    super("initialise");

    this._state = state;
  }

  async execute(): Promise<void> {
    await this._state.stubs?.addToWorkspace();
  }
}

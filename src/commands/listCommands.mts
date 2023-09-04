import type StateContainer from "../stateContainer.mjs";
import { Command } from "./command.mjs";

export default class ListCommandsCommand extends Command {
  private _state: StateContainer;

  constructor(state: StateContainer) {
    super("listCommands");

    this._state = state;
  }

  execute(): void {
    this._state.ui?.showQuickPick();
  }
}

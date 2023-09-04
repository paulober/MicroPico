import { commands, type Disposable } from "vscode";
import { extName } from "../api.mjs";

abstract class BasicCommand {
  private readonly commandId: string;

  protected constructor(commandId: string) {
    this.commandId = commandId;
  }

  register(): Disposable {
    return commands.registerCommand(
      extName + "." + this.commandId,
      this.execute.bind(this)
    );
  }

  abstract execute(): unknown;
}

export abstract class Command extends BasicCommand {
  abstract execute(): Promise<void> | void;
}

export abstract class CommandWithResult<T> extends BasicCommand {
  abstract execute(): Promise<T> | T;
}

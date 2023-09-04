import { Uri, env } from "vscode";
import { Command } from "./command.mjs";

export default class HelpCommand extends Command {
  constructor() {
    super("help");
  }

  execute(): void {
    void env.openExternal(
      Uri.parse("https://github.com/paulober/MicroPico/blob/main/README.md")
    );
  }
}

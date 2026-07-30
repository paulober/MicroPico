import * as vscode from "vscode";
import { commandPrefix } from "../api.mjs";
import type { SessionContext } from "./sessionContext.mjs";

/**
 * Base class for a MicroPico command. Subclasses declare their {@link id}
 * (without the `micropico.` prefix) and implement {@link execute}; the shared
 * mutable session state is reached through the injected {@link SessionContext},
 * so cross-command state lives in exactly one place instead of scattered
 * activator fields. {@link register} wires the command into VS Code.
 */
export abstract class Command {
  public abstract readonly id: string;

  public constructor(protected readonly ctx: SessionContext) {}

  public abstract execute(...args: unknown[]): void | Promise<unknown>;

  /** Register this command with VS Code and track it for disposal. */
  public register(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        commandPrefix + this.id,
        (...args: unknown[]) => this.execute(...args),
      ),
    );
  }
}

/**
 * A command whose {@link execute} resolves a value. VS Code forwards that value
 * to callers of `executeCommand`, so these are the commands other code invokes
 * programmatically for a result rather than only for their side effects.
 */
export abstract class CommandWithResult<T> extends Command {
  public abstract override execute(...args: unknown[]): Promise<T>;
}

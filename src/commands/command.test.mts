import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as vscode from "vscode";
import { __resetCommands } from "../test-support/vscodeStub.mjs";
import { commandPrefix } from "../api.mjs";
import { Command, CommandWithResult } from "./command.mjs";
import { SessionContext } from "./sessionContext.mjs";

const ctx = new SessionContext({} as never);

class PingCommand extends Command {
  public readonly id = "test.ping";
  public ran = 0;
  public lastArgs: unknown[] = [];

  public execute(...args: unknown[]): void {
    this.ran++;
    this.lastArgs = args;
  }
}

class AnswerCommand extends CommandWithResult<number> {
  public readonly id = "test.answer";

  public execute(): Promise<number> {
    return Promise.resolve(42);
  }
}

function fakeContext(): { subscriptions: Array<{ dispose(): void }> } {
  return { subscriptions: [] };
}

describe("Command base", () => {
  beforeEach(() => {
    __resetCommands();
  });

  test("registers under the micropico prefix and runs execute", async () => {
    const cmd = new PingCommand(ctx);
    const context = fakeContext();
    cmd.register(context as never);

    await vscode.commands.executeCommand(commandPrefix + "test.ping", "a", 1);

    assert.equal(cmd.ran, 1);
    assert.deepEqual(cmd.lastArgs, ["a", 1]);
    assert.equal(context.subscriptions.length, 1);
  });

  test("CommandWithResult forwards its resolved value to callers", async () => {
    const cmd = new AnswerCommand(ctx);
    cmd.register(fakeContext() as never);

    const result = await vscode.commands.executeCommand(
      commandPrefix + "test.answer",
    );

    assert.equal(result, 42);
  });
});

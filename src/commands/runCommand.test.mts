import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  __queueWarningMessage,
  __resetPrompts,
} from "../test-support/vscodeStub.mjs";
import { OperationResultType } from "../test-support/picoMpyComStub.mjs";
import { SettingsKey } from "../settings.mjs";
import { SessionContext } from "./sessionContext.mjs";
import { RunCommand } from "./runCommand.mjs";

const DONT_SHOW_AGAIN = "Yes, don't show this again";

function setup(warningDisabled = false): {
  ran: string[];
  updates: Array<[string, unknown]>;
  command: RunCommand;
} {
  const ran: string[] = [];
  const updates: Array<[string, unknown]> = [];
  const com = {
    isPortDisconnected: () => false,
    softReset: () => Promise.resolve({ type: OperationResultType.none }),
    runFile: (file: string) => {
      ran.push(file);

      return Promise.resolve({
        type: OperationResultType.commandResult,
        result: true,
      });
    },
  };
  const settings = {
    getBoolean: (key: SettingsKey) =>
      key === SettingsKey.disableRunFileTypeWarning ? warningDisabled : false,
    update: (key: string, value: unknown) => {
      updates.push([key, value]);

      return Promise.resolve();
    },
  };
  const ctx = new SessionContext(settings as never, com as never);

  return { ran, updates, command: new RunCommand(ctx) };
}

const textFile = { fsPath: "/tmp/data.txt", scheme: "file" };

describe("RunCommand non-Python file warning", () => {
  beforeEach(() => {
    __resetPrompts();
  });

  test("'No' does not run the file", async () => {
    const { ran, updates, command } = setup();
    __queueWarningMessage("No");

    await command.execute(textFile);

    assert.deepEqual(ran, []);
    assert.deepEqual(updates, []);
  });

  test("'Yes' runs the file without remembering the choice", async () => {
    const { ran, updates, command } = setup();
    __queueWarningMessage("Yes");

    await command.execute(textFile);

    assert.deepEqual(ran, ["/tmp/data.txt"]);
    assert.deepEqual(updates, []);
  });

  test("'don't show again' runs the file and saves the setting", async () => {
    const { ran, updates, command } = setup();
    __queueWarningMessage(DONT_SHOW_AGAIN);

    await command.execute(textFile);

    assert.deepEqual(ran, ["/tmp/data.txt"]);
    assert.deepEqual(updates, [[SettingsKey.disableRunFileTypeWarning, true]]);
  });

  test("soft-resets only before running, so timers keep running", async () => {
    let resets = 0;
    const ctx = new SessionContext(
      { getBoolean: () => false } as never,
      {
        isPortDisconnected: () => false,
        softReset: () => {
          resets++;

          return Promise.resolve({ type: OperationResultType.commandResult });
        },
        runFile: () =>
          Promise.resolve({
            type: OperationResultType.commandResult,
            result: true,
          }),
      } as never,
    );

    await new RunCommand(ctx).execute({ fsPath: "/tmp/main.py" });

    assert.equal(resets, 1);
  });

  test("no warning once the setting is enabled", async () => {
    const { ran, command } = setup(true);
    // nothing queued: a shown warning would resolve undefined and abort

    await command.execute(textFile);

    assert.deepEqual(ran, ["/tmp/data.txt"]);
  });
});

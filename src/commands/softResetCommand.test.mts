import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  __queueWarningMessage,
  __resetPrompts,
} from "../test-support/vscodeStub.mjs";
import { OperationResultType } from "../test-support/picoMpyComStub.mjs";
import { SessionContext } from "./sessionContext.mjs";
import { SoftResetCommand } from "./softResetCommand.mjs";

function setup(): {
  ctx: SessionContext;
  calls: { reset: number; interrupt: number };
  finishReset: () => void;
  command: SoftResetCommand;
} {
  const calls = { reset: 0, interrupt: 0 };
  let finishReset = (): void => {};
  const com = {
    isPortDisconnected: () => false,
    interruptExecution: () => {
      calls.interrupt++;
    },
    softReset: () => {
      calls.reset++;

      return new Promise(resolve => {
        finishReset = () =>
          resolve({ type: OperationResultType.commandResult, result: true });
      });
    },
  };

  const ctx = new SessionContext({} as never, com as never);
  ctx.ui = { setBackgroundProgram: () => {} } as never;

  return {
    ctx,
    calls,
    finishReset: () => finishReset(),
    command: new SoftResetCommand(ctx),
  };
}

describe("SoftResetCommand", () => {
  beforeEach(() => {
    __resetPrompts();
  });

  test("repeated clicks while resetting trigger only one reset", async () => {
    const { calls, finishReset, command } = setup();

    const first = command.execute();
    await command.execute();
    await command.execute();
    finishReset();
    await first;

    assert.equal(calls.reset, 1);
  });

  test("asks before resetting a running program and can be canceled", async () => {
    const { ctx, calls, command } = setup();
    ctx.commandExecuting = true;
    __queueWarningMessage(undefined);

    await command.execute();

    assert.deepEqual(calls, { reset: 0, interrupt: 0 });
  });

  test("'Stop and Reset' stops the program, then resets", async () => {
    const { ctx, calls, finishReset, command } = setup();
    ctx.commandExecuting = true;
    __queueWarningMessage("Stop and Reset");

    const run = command.execute();
    // the stop waits a moment before the reset is sent
    await new Promise(resolve => setTimeout(resolve, 600));
    finishReset();
    await run;

    assert.deepEqual(calls, { reset: 1, interrupt: 1 });
  });
});

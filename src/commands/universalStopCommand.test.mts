import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { SessionContext } from "./sessionContext.mjs";
import { UniversalStopCommand } from "./universalStopCommand.mjs";

function setup(opts: { operation: boolean; background: boolean }): {
  ctx: SessionContext;
  calls: { interrupt: number; reset: number };
  command: UniversalStopCommand;
} {
  const calls = { interrupt: 0, reset: 0 };
  const com = {
    isPortDisconnected: () => false,
    interruptExecution: () => {
      calls.interrupt++;
    },
    softReset: () => {
      calls.reset++;

      return Promise.resolve({ type: 2, result: true });
    },
  };

  const ctx = new SessionContext({} as never, com as never);
  ctx.ui = {
    isUserOperationOngoing: () => opts.operation,
    setBackgroundProgram: () => {},
  } as never;
  ctx.backgroundProgram = opts.background;

  return { ctx, calls, command: new UniversalStopCommand(ctx) };
}

describe("UniversalStopCommand", () => {
  test("interrupts a running operation", async () => {
    const { calls, command } = setup({ operation: true, background: true });

    await command.execute();

    assert.deepEqual(calls, { interrupt: 1, reset: 0 });
  });

  test("soft-resets to end a program running in the background", async () => {
    const { ctx, calls, command } = setup({
      operation: false,
      background: true,
    });

    await command.execute();

    assert.deepEqual(calls, { interrupt: 0, reset: 1 });
    assert.equal(ctx.backgroundProgram, false);
  });

  test("does nothing when nothing runs", async () => {
    const { calls, command } = setup({ operation: false, background: false });

    await command.execute();

    assert.deepEqual(calls, { interrupt: 0, reset: 0 });
  });
});

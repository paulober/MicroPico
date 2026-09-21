import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  __getTerminalLookups,
  __queueWarningMessage,
  __resetPrompts,
} from "../test-support/vscodeStub.mjs";
import { SessionContext } from "./sessionContext.mjs";

function makeCtx(
  com: Partial<{ interruptExecution(): void }> = {},
  settings: Record<string, unknown> = {},
): SessionContext {
  const fakeSettings = {
    getBoolean: (key: string) => settings[key],
    update: (key: string, value: unknown) => {
      settings[key] = value;

      return Promise.resolve();
    },
  };

  return new SessionContext(fakeSettings as never, com as never);
}

describe("SessionContext.checkForRunningOperation", () => {
  beforeEach(() => {
    __resetPrompts();
  });

  test("returns false immediately when nothing is running", async () => {
    const ctx = makeCtx();
    ctx.commandExecuting = false;

    assert.equal(await ctx.checkForRunningOperation(), false);
  });

  test("aborts (true) when the user keeps the running operation", async () => {
    const ctx = makeCtx();
    ctx.commandExecuting = true;
    __queueWarningMessage("No");

    assert.equal(await ctx.checkForRunningOperation(), true);
  });

  test("proceeds (false) when the user cancels what runs", async () => {
    let interrupted = 0;
    const ctx = makeCtx({ interruptExecution: () => interrupted++ });
    ctx.commandExecuting = true;
    __queueWarningMessage("Yes");

    assert.equal(await ctx.checkForRunningOperation(), false);
    assert.equal(interrupted, 1);
  });
});

describe("SessionContext.revealTerminal", () => {
  test("leaves the plotter in front when it's open", async () => {
    const ctx = makeCtx();
    ctx.output = { isPlotterVisible: () => true } as never;
    const before = __getTerminalLookups();

    await ctx.revealTerminal();

    assert.equal(__getTerminalLookups(), before);
  });

  test("shows the vREPL otherwise", async () => {
    const ctx = makeCtx();
    ctx.output = { isPlotterVisible: () => false } as never;
    const before = __getTerminalLookups();

    await ctx.revealTerminal();

    assert.equal(__getTerminalLookups(), before + 1);
  });
});

describe("SessionContext.showNoActivePythonError", () => {
  test("does not throw", () => {
    assert.doesNotThrow(() => makeCtx().showNoActivePythonError());
  });
});

describe("SessionContext.checkForRunningOperation with an action", () => {
  beforeEach(() => {
    __resetPrompts();
  });

  test("proceeds only on the 'Stop and <action>' button", async () => {
    let interrupted = 0;
    const ctx = makeCtx({ interruptExecution: () => interrupted++ });
    ctx.commandExecuting = true;
    __queueWarningMessage("Stop and Upload");

    assert.equal(await ctx.checkForRunningOperation("Upload"), false);
    assert.equal(interrupted, 1);
  });

  test("aborts when the dialog is dismissed", async () => {
    let interrupted = 0;
    const ctx = makeCtx({ interruptExecution: () => interrupted++ });
    ctx.commandExecuting = true;
    __queueWarningMessage(undefined);

    assert.equal(await ctx.checkForRunningOperation("Upload"), true);
    assert.equal(interrupted, 0);
  });

  test("stops without asking when always stop is enabled", async () => {
    let interrupted = 0;
    const ctx = makeCtx(
      { interruptExecution: () => interrupted++ },
      { alwaysStopRunningProgram: true },
    );
    ctx.commandExecuting = true;

    assert.equal(await ctx.checkForRunningOperation("Upload"), false);
    assert.equal(interrupted, 1);
  });

  test("'Always Stop' stops and remembers the choice", async () => {
    const settings: Record<string, unknown> = {};
    let interrupted = 0;
    const ctx = makeCtx({ interruptExecution: () => interrupted++ }, settings);
    ctx.commandExecuting = true;
    __queueWarningMessage("Always Stop");

    assert.equal(await ctx.checkForRunningOperation("Reset"), false);
    assert.equal(interrupted, 1);
    assert.equal(settings.alwaysStopRunningProgram, true);
  });
});

describe("SessionContext with a program running in the background", () => {
  beforeEach(() => {
    __resetPrompts();
  });

  function backgroundCtx(): { ctx: SessionContext; resets: () => number } {
    let resets = 0;
    const ctx = makeCtx({
      softReset: () => {
        resets++;

        return Promise.resolve({ type: 2, result: true });
      },
    } as never);
    ctx.backgroundProgram = true;

    return { ctx, resets: () => resets };
  }

  test("offers to stop it before a file operation", async () => {
    const { ctx, resets } = backgroundCtx();
    __queueWarningMessage("Stop and Upload");

    assert.equal(await ctx.checkForRunningOperation("Upload"), false);
    assert.equal(resets(), 1);
    assert.equal(ctx.backgroundProgram, false);
  });

  test("leaves it running when the dialog is dismissed", async () => {
    const { ctx, resets } = backgroundCtx();
    __queueWarningMessage(undefined);

    assert.equal(await ctx.checkForRunningOperation("Upload"), true);
    assert.equal(resets(), 0);
    assert.equal(ctx.backgroundProgram, true);
  });

  test("doesn't ask without an action, Run resets the board anyway", async () => {
    const { ctx, resets } = backgroundCtx();

    assert.equal(await ctx.checkForRunningOperation(), false);
    assert.equal(resets(), 0);
  });
});

import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  __queueWarningMessage,
  __resetPrompts,
} from "../test-support/vscodeStub.mjs";
import { SessionContext } from "./sessionContext.mjs";

function makeCtx(
  com: Partial<{ interruptExecution(): void }> = {},
): SessionContext {
  return new SessionContext({} as never, com as never);
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

describe("SessionContext.showNoActivePythonError", () => {
  test("does not throw", () => {
    assert.doesNotThrow(() => makeCtx().showNoActivePythonError());
  });
});

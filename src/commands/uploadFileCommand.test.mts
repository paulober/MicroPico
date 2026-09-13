import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  __lastProgressTask,
  __queueWarningMessage,
  __resetPrompts,
} from "../test-support/vscodeStub.mjs";
import { OperationResultType } from "../test-support/picoMpyComStub.mjs";
import { SessionContext } from "./sessionContext.mjs";
import { UploadFileCommand } from "./uploadFileCommand.mjs";

type ProgressCb = (total: number, current: number, path: string) => void;

function setup(opts: { running: boolean; reportsProgress?: boolean }): {
  calls: Record<"interrupt" | "upload" | "started" | "stopped", number>;
  command: UploadFileCommand;
} {
  const calls = { interrupt: 0, upload: 0, started: 0, stopped: 0 };
  const com = {
    isPortDisconnected: () => false,
    interruptExecution: () => {
      calls.interrupt++;
    },
    uploadFiles: (
      _files: string[],
      _dest: string,
      _root: string | undefined,
      progress?: ProgressCb,
    ) => {
      calls.upload++;
      if (opts.reportsProgress ?? true) {
        progress?.(1, 1, "main.py");
      }

      return Promise.resolve({
        type: OperationResultType.commandResult,
        result: true,
      });
    },
  };
  const settings = { getBoolean: () => false };

  const ctx = new SessionContext(settings as never, com as never);
  ctx.commandExecuting = opts.running;
  ctx.ui = {
    userOperationStarted: () => calls.started++,
    userOperationStopped: () => calls.stopped++,
  } as never;

  return { calls, command: new UploadFileCommand(ctx) };
}

const file = { fsPath: "/tmp/main.py" };

describe("UploadFileCommand", () => {
  beforeEach(() => {
    __resetPrompts();
  });

  test("uploads right away when no program is running", async () => {
    const { calls, command } = setup({ running: false });

    await command.execute(file);
    await __lastProgressTask();

    assert.equal(calls.upload, 1);
    assert.equal(calls.interrupt, 0);
  });

  test("does not upload when the user keeps the running program", async () => {
    const { calls, command } = setup({ running: true });
    __queueWarningMessage(undefined);

    await command.execute(file);

    assert.equal(calls.upload, 0);
    assert.equal(calls.interrupt, 0);
  });

  test("stops the running program, then uploads", async () => {
    const { calls, command } = setup({ running: true });
    __queueWarningMessage("Stop and Upload");

    await command.execute(file);
    await __lastProgressTask();

    assert.equal(calls.interrupt, 1);
    assert.equal(calls.upload, 1);
  });

  test("keeps the user-operation counter balanced", async () => {
    const withProgress = setup({ running: false });
    await withProgress.command.execute(file);
    await __lastProgressTask();
    assert.deepEqual(
      [withProgress.calls.started, withProgress.calls.stopped],
      [1, 1],
    );

    // nothing to transfer: no progress is reported, so nothing to stop either
    const noProgress = setup({ running: false, reportsProgress: false });
    await noProgress.command.execute(file);
    await __lastProgressTask();
    assert.deepEqual(
      [noProgress.calls.started, noProgress.calls.stopped],
      [0, 0],
    );
  });
});

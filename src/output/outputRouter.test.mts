import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  __queueQuickPick,
  __queueSaveDialog,
  __resetPrompts,
} from "../test-support/vscodeStub.mjs";
import { OutputRouter, type PlotterSink } from "./outputRouter.mjs";

class FakePlotter implements PlotterSink {
  public visible = false;
  public labels: string[][] = [];
  public samples: number[][] = [];

  public isVisible(): boolean {
    return this.visible;
  }
  public setLabels(labels: string[]): void {
    this.labels.push(labels);
  }
  public addSample(values: number[]): void {
    this.samples.push(values);
  }
}

describe("OutputRouter", () => {
  beforeEach(() => {
    __resetPrompts();
  });

  test("does not touch the plotter while its view is hidden", () => {
    const plotter = new FakePlotter();
    plotter.visible = false;
    const router = new OutputRouter(plotter, () => {});

    router.route(Buffer.from("1,2,3\r\n"));

    assert.deepEqual(plotter.samples, []);
    assert.deepEqual(plotter.labels, []);
  });

  test("does not append when no redirect target is set", () => {
    const plotter = new FakePlotter();
    let appended = 0;
    const router = new OutputRouter(plotter, () => {
      appended++;
    });

    router.route(Buffer.from("hello"));

    assert.equal(router.getTarget(), undefined);
    assert.equal(appended, 0);
  });

  test("appends board output to the file once a target is picked", async () => {
    const plotter = new FakePlotter();
    const writes: Array<{ path: string; data: Buffer }> = [];
    const router = new OutputRouter(plotter, (path, data) => {
      writes.push({ path, data });
    });

    __queueQuickPick("$(arrow-right) File");
    __queueSaveDialog({ fsPath: "/tmp/out.log" });
    await router.promptForRedirect();
    assert.equal(router.getTarget(), "/tmp/out.log");

    router.route(Buffer.from("abc"));
    assert.equal(writes.length, 1);
    assert.equal(writes[0].path, "/tmp/out.log");
    assert.equal(writes[0].data.toString(), "abc");
  });

  test("disabling clears the redirect target", async () => {
    const plotter = new FakePlotter();
    const router = new OutputRouter(plotter, () => {});

    __queueQuickPick("$(arrow-right) File");
    __queueSaveDialog({ fsPath: "/tmp/out.log" });
    await router.promptForRedirect();
    assert.equal(router.getTarget(), "/tmp/out.log");

    __queueQuickPick("$(x) Disable");
    await router.promptForRedirect();
    assert.equal(router.getTarget(), undefined);
  });

  test("a failing append is swallowed, not thrown", async () => {
    const plotter = new FakePlotter();
    const router = new OutputRouter(plotter, () => {
      throw new Error("disk full");
    });

    __queueQuickPick("$(arrow-right) File");
    __queueSaveDialog({ fsPath: "/tmp/out.log" });
    await router.promptForRedirect();

    assert.doesNotThrow(() => router.route(Buffer.from("x")));
  });
});

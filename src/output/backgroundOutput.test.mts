import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { SessionContext } from "../commands/sessionContext.mjs";
import { BackgroundOutput } from "./backgroundOutput.mjs";

function setup(): {
  ctx: SessionContext;
  shown: string[];
  routed: string[];
  uiCalls: boolean[];
  handler: BackgroundOutput;
} {
  const shown: string[] = [];
  const routed: string[] = [];
  const uiCalls: boolean[] = [];

  const ctx = new SessionContext({} as never, {} as never);
  ctx.terminal = {
    writeAbovePrompt: (text: string) => shown.push(text),
  } as never;
  ctx.output = {
    route: (data: Buffer) => routed.push(data.toString("utf8")),
  } as never;
  ctx.ui = {
    setBackgroundProgram: (running: boolean) => uiCalls.push(running),
  } as never;

  return { ctx, shown, routed, uiCalls, handler: new BackgroundOutput(ctx) };
}

describe("BackgroundOutput", () => {
  test("shows lines above the prompt and feeds the plotter", () => {
    const { shown, routed, handler } = setup();

    handler.handle(Buffer.from("1, 2\r\n3, 4\r\n"));

    assert.deepEqual(shown, ["1, 2\r\n3, 4\r\n"]);
    assert.deepEqual(routed, ["1, 2\r\n3, 4\r\n"]);
  });

  test("marks a program as running in the background once", () => {
    const { ctx, uiCalls, handler } = setup();

    handler.handle(Buffer.from("tick\r\n"));
    handler.handle(Buffer.from("tick\r\n"));

    assert.equal(ctx.backgroundProgram, true);
    assert.deepEqual(uiCalls, [true]);
  });

  test("waits for the rest of an unfinished line", () => {
    const { shown, handler } = setup();

    handler.handle(Buffer.from("ti"));
    assert.deepEqual(shown, []);

    handler.handle(Buffer.from("ck\r\nto"));
    assert.deepEqual(shown, ["tick\r\n"]);
  });

  test("shows an unfinished line after a short pause", t => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const { shown, handler } = setup();

    handler.handle(Buffer.from("42"));
    t.mock.timers.tick(199);
    assert.deepEqual(shown, []);

    t.mock.timers.tick(1);
    assert.deepEqual(shown, ["42\r\n"]);
  });

  test("keeps multi-byte characters split across chunks intact", () => {
    const { shown, handler } = setup();
    const bytes = Buffer.from("°C\r\n", "utf8");

    handler.handle(bytes.subarray(0, 1));
    handler.handle(bytes.subarray(1));

    assert.deepEqual(shown, ["°C\r\n"]);
  });
});

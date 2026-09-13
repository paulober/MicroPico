import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Terminal } from "./terminal.mjs";

/** An open vREPL showing its prompt, with everything written after that. */
async function openTerminal(): Promise<{ terminal: Terminal; writes: string[] }> {
  const writes: string[] = [];
  const terminal = new Terminal(() => Promise.resolve(""));
  terminal.onDidWrite(data => writes.push(data));
  terminal.open(undefined);
  // the opening message and first prompt are written asynchronously
  await new Promise(resolve => setImmediate(resolve));
  writes.length = 0;

  return { terminal, writes };
}

describe("Terminal.writeAbovePrompt", () => {
  test("prints above the prompt and keeps the typed input", async () => {
    const { terminal, writes } = await openTerminal();
    terminal.handleInput("pri");
    writes.length = 0;

    terminal.writeAbovePrompt("tick\r\n");

    const output = writes.join("");
    assert.ok(output.startsWith("\x1b[u\x1b[0J\r\x1b[2Ktick\r\n"), output);
    assert.ok(output.endsWith(">>> \x1b7pri"), output);
  });

  test("puts the cursor back inside the input", async () => {
    const { terminal, writes } = await openTerminal();
    terminal.handleInput("print");
    terminal.handleInput("\x1b[D");
    terminal.handleInput("\x1b[D");
    writes.length = 0;

    terminal.writeAbovePrompt("tick\r\n");

    assert.equal(writes.at(-1), "\x1b[2D");
  });

  test("writes plainly while the prompt is not shown", async () => {
    const { terminal, writes } = await openTerminal();
    terminal.freeze();
    writes.length = 0;

    terminal.writeAbovePrompt("tick\r\n");

    assert.deepEqual(writes, ["tick\r\n"]);
  });
});

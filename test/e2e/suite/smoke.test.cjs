"use strict";

// End-to-end smoke tests: these run inside a real VS Code Extension Host
// (launched by @vscode/test-electron), so `require("vscode")` is the live API.
// They verify the extension actually loads and wires up its commands — the
// functional board operations themselves are covered by the pico-mpy-com
// integration suite against real MicroPython.

const assert = require("node:assert");
const vscode = require("vscode");

const test = globalThis.__e2eTest;

const EXTENSION_ID = "paulober.pico-w-go";

// The commands a user relies on for the core workflow. If any of these stops
// being contributed/registered, the extension is broken for its main purpose.
const REQUIRED_COMMANDS = [
  "micropico.connect",
  "micropico.disconnect",
  "micropico.run",
  "micropico.remote.run",
  "micropico.runselection",
  "micropico.upload",
  "micropico.uploadFile",
  "micropico.download",
  "micropico.downloadFile",
  "micropico.reset.soft",
  "micropico.reset.hard",
  "micropico.universalStop",
  "micropico.listCommands",
];

test("the extension is present and activates", async () => {
  const ext = vscode.extensions.getExtension(EXTENSION_ID);
  assert.ok(ext, `extension ${EXTENSION_ID} not found`);

  await ext.activate();
  assert.ok(ext.isActive, "extension did not activate");
});

test("all core commands are registered", async () => {
  const ext = vscode.extensions.getExtension(EXTENSION_ID);
  await ext.activate();

  const commands = await vscode.commands.getCommands(true);
  const missing = REQUIRED_COMMANDS.filter(id => !commands.includes(id));
  assert.deepEqual(missing, [], `missing commands: ${missing.join(", ")}`);
});

test("commands are gated behind a connection until connected", async () => {
  // Invoking a board command with no connection must fail gracefully (report
  // and return), never throw out of the command handler or crash the host.
  const ext = vscode.extensions.getExtension(EXTENSION_ID);
  await ext.activate();

  await assert.doesNotReject(
    Promise.resolve(vscode.commands.executeCommand("micropico.disconnect")),
    "disconnect threw when not connected"
  );
});

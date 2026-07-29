"use strict";

// Minimal in-process test runner for the VS Code Extension Host. @vscode/test-
// electron calls run() inside the host and awaits the returned promise; we run
// the registered tests sequentially and reject if any fail. Deliberately
// dependency-free — the suite is small and node's assert is enough, so there is
// no need to pull in a test framework just for the host.

const path = require("node:path");

/** @type {{ name: string; fn: () => Promise<void> | void }[]} */
const tests = [];
globalThis.__e2eTest = (name, fn) => tests.push({ name, fn });

const TEST_TIMEOUT_MS = 30_000;

function withTimeout(promise, name) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`timed out after ${TEST_TIMEOUT_MS}ms`)),
        TEST_TIMEOUT_MS
      ).unref()
    ),
  ]).catch(err => {
    throw new Error(`${name}: ${err.message}`);
  });
}

async function run() {
  // Registering the test files populates `tests` via globalThis.__e2eTest.
  require(path.resolve(__dirname, "smoke.test.cjs"));

  let failed = 0;
  console.log(`\nRunning ${tests.length} E2E test(s):\n`);
  for (const { name, fn } of tests) {
    try {
      await withTimeout(fn(), name);
      console.log(`  ✓ ${name}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${name}`);
      console.error(`      ${err && err.stack ? err.stack : err}`);
    }
  }

  console.log(`\n${tests.length - failed}/${tests.length} passed\n`);
  if (failed > 0) {
    throw new Error(`${failed} E2E test(s) failed`);
  }
}

module.exports = { run };

import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setConfig, __resetConfig } from "./test-support/vscodeStub.mjs";
import Settings from "./settings.mjs";

function makeSettings(): Settings {
  // Settings only stores the Memento; getCustomVidPidPairs never touches it.
  return new Settings({} as never);
}

describe("Settings.getCustomVidPidPairs", () => {
  beforeEach(() => {
    __resetConfig();
  });

  test("returns undefined when the setting is not an array", () => {
    __setConfig("micropico", { customVidPidPairs: undefined });
    assert.equal(makeSettings().getCustomVidPidPairs(), undefined);
  });

  test("returns an empty array when configured empty", () => {
    __setConfig("micropico", { customVidPidPairs: [] });
    assert.deepEqual(makeSettings().getCustomVidPidPairs(), []);
  });

  test("keeps only well-formed numeric {vid, pid} pairs", () => {
    __setConfig("micropico", {
      customVidPidPairs: [
        { vid: 1027, pid: 24592 },
        { vid: "x", pid: 1 },
        { vid: 1 },
        null,
        "nope",
        { vid: 2, pid: 3 },
      ],
    });

    assert.deepEqual(makeSettings().getCustomVidPidPairs(), [
      { vid: 1027, pid: 24592 },
      { vid: 2, pid: 3 },
    ]);
  });
});

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { resolveRemoteRunOverride } from "./remoteRunCommand.mjs";

describe("resolveRemoteRunOverride", () => {
  test("uses a string override as-is", () => {
    assert.equal(resolveRemoteRunOverride("/main.py"), "/main.py");
  });

  test("uses the path of a pico:// URI (was previously dropped)", () => {
    const uri = { scheme: "pico", path: "/lib/mod.py" };
    assert.equal(resolveRemoteRunOverride(uri), "/lib/mod.py");
  });

  test("ignores a non-pico URI so the caller falls back", () => {
    const uri = { scheme: "file", path: "/home/x/main.py", fsPath: "/x" };
    assert.equal(resolveRemoteRunOverride(uri), undefined);
  });

  test("returns undefined for no override", () => {
    assert.equal(resolveRemoteRunOverride(undefined), undefined);
  });
});

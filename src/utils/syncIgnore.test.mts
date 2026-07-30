import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveIgnoredSyncItems,
  DEFAULT_IGNORED_SYNC_ITEMS,
} from "./syncIgnore.mjs";

describe("resolveIgnoredSyncItems", () => {
  test("always includes the default ignore items", () => {
    const result = resolveIgnoredSyncItems([], "/proj/src");
    assert.deepEqual(result, DEFAULT_IGNORED_SYNC_ITEMS);
  });

  test("keeps global (unscoped) items as-is", () => {
    const result = resolveIgnoredSyncItems(["*.log", "secret.py"], "/proj");
    assert.ok(result.includes("*.log"));
    assert.ok(result.includes("secret.py"));
  });

  test("keeps a scoped item only for its folder, stripping the prefix", () => {
    const items = ["/proj/src:build/", "/proj/other:dist/"];

    const forSrc = resolveIgnoredSyncItems(items, "/proj/src");
    assert.ok(forSrc.includes("build/"));
    assert.ok(!forSrc.includes("dist/"));

    const forOther = resolveIgnoredSyncItems(items, "/proj/other");
    assert.ok(forOther.includes("dist/"));
    assert.ok(!forOther.includes("build/"));
  });

  test("does not mutate the shared defaults array", () => {
    resolveIgnoredSyncItems(["a", "b"], "/proj");
    assert.deepEqual(DEFAULT_IGNORED_SYNC_ITEMS, [
      "**/.picowgo",
      "**/.micropico",
      "**/.DS_Store",
    ]);
  });
});

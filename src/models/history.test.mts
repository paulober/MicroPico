import { describe, test } from "node:test";
import assert from "node:assert/strict";
import History from "./history.mjs";

describe("History", () => {
  test("is empty and safe to navigate on creation", () => {
    const h = new History();
    assert.deepEqual(h.getItems(), []);
    assert.equal(h.arrowUp(), "");
    assert.equal(h.arrowDown(), "");
  });

  test("stores newest first and walks up then back down", () => {
    const h = new History();
    h.add("first");
    h.add("second");
    assert.deepEqual(h.getItems(), ["second", "first"]);

    // arrowUp walks from newest to oldest and clamps at the oldest
    assert.equal(h.arrowUp(), "second");
    assert.equal(h.arrowUp(), "first");
    assert.equal(h.arrowUp(), "first");

    // arrowDown walks back toward newest, then clears the selection
    assert.equal(h.arrowDown(), "second");
    assert.equal(h.arrowDown(), "");
  });

  test("re-adding moves an item to front and resets position", () => {
    const h = new History();
    h.add("a");
    h.add("b");
    h.arrowUp();
    h.add("a");

    assert.deepEqual(h.getItems(), ["a", "b"]);
    assert.equal(h.arrowUp(), "a");
  });

  test("clear empties history and resets navigation", () => {
    const h = new History();
    h.add("a");
    h.clear();
    assert.deepEqual(h.getItems(), []);
    assert.equal(h.arrowUp(), "");
  });
});

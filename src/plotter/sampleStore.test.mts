import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { SampleStore } from "./sampleStore.mjs";

describe("SampleStore", () => {
  test("never keeps much more than the cap and drops the oldest", () => {
    const store = new SampleStore(10);
    for (let i = 0; i < 100; i++) {
      store.add([i]);
      assert.ok(store.size <= 11, `size ${store.size} exceeds the cap`);
    }

    const newest = store.tail(3).map(([v]) => v);
    assert.deepEqual(newest, [97, 98, 99]);
  });

  test("tail returns everything when asked for more than stored", () => {
    const store = new SampleStore();
    store.add([1]);
    store.add([2]);

    assert.deepEqual(store.tail(1000), [[1], [2]]);
  });

  test("exports CSV with labels", () => {
    const store = new SampleStore();
    store.add([23.5, 60]);
    store.add([23.6, 61]);

    assert.equal(
      store.toCsv(["temp", "humidity"]),
      "temp,humidity\n23.5,60\n23.6,61\n",
    );
  });

  test("sizes the header to the widest row", () => {
    const store = new SampleStore();
    store.add([1]);
    store.add([1, 2, 3]);

    // labels no longer match, so generic names are used
    assert.equal(
      store.toCsv(["a"]),
      "series_1,series_2,series_3\n1\n1,2,3\n",
    );
  });

  test("has nothing to export when empty or cleared", () => {
    const store = new SampleStore();
    assert.equal(store.toCsv([]), undefined);

    store.add([1]);
    store.clear();
    assert.equal(store.toCsv([]), undefined);
  });
});

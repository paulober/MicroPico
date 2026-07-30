import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  buildStubVersionOptions,
  parseStubVersionSelection,
  type StubVersionsByPort,
} from "./stubVersionOptions.mjs";

// Simple invertible mappers standing in for the real stub port helpers.
const label = (key: string): string => `port(${key})`;
const toKey = (lbl: string): string => lbl.replace(/^port\(|\)$/g, "");

describe("buildStubVersionOptions", () => {
  test("uses bare versions when only one port is available", () => {
    const options = buildStubVersionOptions({ rp2: ["1.0", "1.1"] }, label);
    assert.deepEqual(options, ["1.0", "1.1"]);
  });

  test("prefixes with the port label when multiple ports exist", () => {
    const options = buildStubVersionOptions(
      { rp2: ["1.0"], esp32: ["2.0", "2.1"] },
      label,
    );
    assert.deepEqual(options, [
      "port(rp2) - 1.0",
      "port(esp32) - 2.0",
      "port(esp32) - 2.1",
    ]);
  });
});

describe("parseStubVersionSelection", () => {
  test("returns the sole port for a bare version", () => {
    const available = { rp2: ["1.0", "1.1"] };
    const result = parseStubVersionSelection("1.1", available, toKey);
    assert.deepEqual(result, { port: "rp2", version: "1.1" });
  });

  test("splits a prefixed label back into port key and version", () => {
    const available = { rp2: ["1.0"], esp32: ["2.1"] };
    const result = parseStubVersionSelection(
      "port(esp32) - 2.1",
      available,
      toKey,
    );
    assert.deepEqual(result, { port: "esp32", version: "2.1" });
  });

  test("round-trips every built option back to a valid port/version", () => {
    const available: StubVersionsByPort = {
      rp2: ["1.0"],
      esp32: ["2.0", "2.1"],
    };
    for (const option of buildStubVersionOptions(available, label)) {
      const { port, version } = parseStubVersionSelection(
        option,
        available,
        toKey,
      );
      assert.ok(
        available[port].includes(version),
        `${option} did not round-trip`,
      );
    }
  });
});

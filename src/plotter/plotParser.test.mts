import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PlotParser, type PlotEvent } from "./plotParser.mjs";

function events(...chunks: string[]): PlotEvent[] {
  const parser = new PlotParser();

  return chunks.flatMap(chunk => parser.push(chunk));
}

describe("PlotParser", () => {
  test("emits a sample for a comma-separated numeric line", () => {
    assert.deepEqual(events("1, 2, 3\n"), [
      { type: "sample", values: [1, 2, 3] },
    ]);
  });

  test("supports whitespace-separated numbers and a single value", () => {
    assert.deepEqual(events("1 2 3\n"), [
      { type: "sample", values: [1, 2, 3] },
    ]);
    assert.deepEqual(events("42\n"), [{ type: "sample", values: [42] }]);
  });

  test("parses floats, signs and scientific notation", () => {
    assert.deepEqual(events("-1.5, .25, 2e3\n"), [
      { type: "sample", values: [-1.5, 0.25, 2000] },
    ]);
  });

  test("adopts a header that precedes matching data", () => {
    assert.deepEqual(events("temp, humidity\n", "23.5, 60\n"), [
      { type: "labels", labels: ["temp", "humidity"] },
      { type: "sample", values: [23.5, 60] },
    ]);
  });

  test("ignores plain text output and does not treat it as a header", () => {
    assert.deepEqual(events("Starting the test...\n", "1, 2\n"), [
      { type: "sample", values: [1, 2] },
    ]);
  });

  test("ignores a header whose column count does not match the data", () => {
    assert.deepEqual(events("a, b, c\n", "1, 2\n"), [
      { type: "sample", values: [1, 2] },
    ]);
  });

  test("ignores mixed numeric/non-numeric lines", () => {
    assert.deepEqual(events("1, 2, oops\n"), []);
  });

  test("buffers partial lines across chunks", () => {
    assert.deepEqual(events("1, 2", ", 3\n4, 5, 6\n"), [
      { type: "sample", values: [1, 2, 3] },
      { type: "sample", values: [4, 5, 6] },
    ]);
  });

  test("handles CRLF line endings", () => {
    assert.deepEqual(events("7, 8\r\n"), [
      { type: "sample", values: [7, 8] },
    ]);
  });
});

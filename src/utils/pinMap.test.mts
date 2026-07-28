import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  getPinMapHtml,
  PICO_VARIANTS,
  PICO_VARAINTS_PINOUTS,
} from "./pinMap.mjs";

describe("getPinMapHtml", () => {
  test("returns HTML containing the variant name and image url", () => {
    const html = getPinMapHtml("Pico (H)", "vscode-resource://pico-pinout.svg");

    assert.equal(typeof html, "string");
    assert.ok(html.includes("Pico (H)"));
    assert.ok(html.includes("vscode-resource://pico-pinout.svg"));
  });

  test("exports matching variant and pinout arrays", () => {
    assert.equal(PICO_VARIANTS.length, PICO_VARAINTS_PINOUTS.length);
    assert.deepEqual(PICO_VARIANTS, ["Pico (H)", "Pico W(H)"]);
    assert.deepEqual(PICO_VARAINTS_PINOUTS, [
      "pico-pinout.svg",
      "picow-pinout.svg",
    ]);
  });
});

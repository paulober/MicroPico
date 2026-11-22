import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { boardChoices } from "./boardFirmware.mjs";
import { SupportedFirmwareTypes } from "../downloadFirmware.mjs";

describe("boardChoices", () => {
  test("offers the Pico and the Pico W for an RP2040", () => {
    assert.deepEqual(
      boardChoices("RP2040").map(c => [c.label, c.firmware]),
      [
        ["Raspberry Pi Pico", SupportedFirmwareTypes.pico],
        ["Raspberry Pi Pico W", SupportedFirmwareTypes.picow],
      ],
    );
  });

  test("offers the Pico 2 and the Pico 2 W for an RP2350", () => {
    assert.deepEqual(
      boardChoices("RP2350").map(c => [c.label, c.firmware]),
      [
        ["Raspberry Pi Pico 2", SupportedFirmwareTypes.pico2],
        ["Raspberry Pi Pico 2 W", SupportedFirmwareTypes.pico2w],
      ],
    );
  });

  test("marks only the boards with Wi-Fi", () => {
    const [plain, wireless] = boardChoices("RP2350");
    assert.equal(plain.description, undefined);
    assert.equal(wireless.description, "with Wi-Fi");
  });

  test("offers nothing for an unknown chip", () => {
    assert.deepEqual(boardChoices("RP2354"), []);
  });
});

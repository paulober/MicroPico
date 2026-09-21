import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { describePort } from "./portName.mjs";

const port = { path: "/dev/test", supported: false };

describe("describePort", () => {
  test("names known vendors and shows the USB IDs", () => {
    assert.equal(
      describePort({
        ...port,
        manufacturer: "MicroPython",
        vendorId: 0x2e8a,
        productId: 0x0005,
      }),
      "Raspberry Pi · USB 2E8A:0005",
    );
  });

  test("falls back to the manufacturer for unknown vendors", () => {
    assert.equal(
      describePort({
        ...port,
        manufacturer: "Some Maker",
        vendorId: 0x1234,
        productId: 0xabcd,
      }),
      "Some Maker · USB 1234:ABCD",
    );
  });

  test("skips generic manufacturer names", () => {
    assert.equal(
      describePort({
        ...port,
        manufacturer: "Microsoft",
        vendorId: 0x1234,
        productId: 0x0001,
      }),
      "USB 1234:0001",
    );
  });

  test("is empty for ports without any details", () => {
    assert.equal(describePort(port), "");
  });
});

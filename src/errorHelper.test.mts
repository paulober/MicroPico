import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { unknownErrorToString } from "./errorHelper.mjs";

describe("unknownErrorToString", () => {
  test("returns the message of an Error instance", () => {
    assert.equal(unknownErrorToString(new Error("boom")), "boom");
  });

  test("passes strings through unchanged", () => {
    assert.equal(unknownErrorToString("plain failure"), "plain failure");
  });

  test("stringifies numbers and booleans", () => {
    assert.equal(unknownErrorToString(42), "42");
    assert.equal(unknownErrorToString(true), "true");
  });

  test("JSON-encodes plain objects", () => {
    assert.equal(unknownErrorToString({ code: 7 }), '{"code":7}');
  });

  test("has dedicated fallbacks for undefined and other types", () => {
    assert.equal(unknownErrorToString(undefined), "Undefined error");
    assert.equal(unknownErrorToString(Symbol("x")), "Unknown error");
  });
});

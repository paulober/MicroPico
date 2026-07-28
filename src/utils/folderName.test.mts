import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { isValidFolderName } from "./folderName.mjs";

describe("isValidFolderName", () => {
  test("accepts valid folder names", () => {
    assert.equal(isValidFolderName("myFolder"), true);
    assert.equal(isValidFolderName("folder_123"), true);
    assert.equal(isValidFolderName("my folder-name.v2"), true);
  });

  test("rejects names containing each invalid character", () => {
    for (const char of ["<", ">", ":", '"', "/", "\\", "|", "?", "*"]) {
      assert.equal(
        isValidFolderName(`bad${char}name`),
        false,
        `expected "${char}" to be rejected`,
      );
    }
  });

  test("rejects reserved device names", () => {
    assert.equal(isValidFolderName("CON"), false);
    assert.equal(isValidFolderName("com1"), false);
    assert.equal(isValidFolderName("LPT9"), false);
  });

  test("is not stateful across repeated calls with the same input", () => {
    // Guards against the previous `g`-flag regex making `.test()` stateful.
    assert.equal(isValidFolderName("bad*name"), false);
    assert.equal(isValidFolderName("bad*name"), false);
  });
});

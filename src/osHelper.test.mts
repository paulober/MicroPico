import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  pathExists,
  readJsonFile,
  writeJsonFile,
  searchFile,
} from "./osHelper.mjs";

describe("osHelper", () => {
  let dir: string;

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), "micropico-test-"));
  });

  after(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test("pathExists reflects file presence", async () => {
    const file = join(dir, "a.txt");
    assert.equal(await pathExists(file), false);
    await writeFile(file, "hi");
    assert.equal(await pathExists(file), true);
  });

  test("writeJsonFile and readJsonFile round-trip", async () => {
    const file = join(dir, "data.json");
    const payload = { name: "pico", pins: [0, 1, 2] };
    await writeJsonFile(file, payload);
    assert.deepEqual(await readJsonFile<typeof payload>(file), payload);
  });

  test("readJsonFile returns undefined for missing/invalid files", async () => {
    assert.equal(await readJsonFile(join(dir, "nope.json")), undefined);

    const bad = join(dir, "bad.json");
    await writeFile(bad, "{ not json ");
    assert.equal(await readJsonFile(bad), undefined);
  });

  test("searchFile finds a file nested in subdirectories", async () => {
    const nested = join(dir, "sub", "deep");
    await mkdir(nested, { recursive: true });
    await writeFile(join(nested, ".micropico"), "");

    const found = searchFile(dir, ".micropico");
    assert.ok(found);
    assert.ok(found?.endsWith(".micropico"));
    assert.equal(searchFile(dir, "does-not-exist.xyz"), undefined);
  });
});

import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  __changeConfig,
  __getConfigScopes,
  __setConfig,
  __setWorkspaceFolders,
  __resetConfig,
} from "./test-support/vscodeStub.mjs";
import Settings from "./settings.mjs";
import { getProjectWorkspaceFolder } from "./api.mjs";

function makeSettings(): Settings {
  // Settings only stores the Memento; getCustomVidPidPairs never touches it.
  return new Settings({} as never);
}

describe("Settings.update", () => {
  beforeEach(() => {
    __resetConfig();
  });

  test("a saved value is read back right away", async () => {
    __setConfig("micropico", { disableRunFileTypeWarning: false });
    const settings = makeSettings();

    await settings.update("disableRunFileTypeWarning", true);

    // the configuration is a cached snapshot; without a reload this stayed false
    assert.equal(settings.get("disableRunFileTypeWarning"), true);
  });
});

describe("Settings.watch", () => {
  beforeEach(() => {
    __resetConfig();
  });

  test("picks up a change made in the settings UI", () => {
    __setConfig("micropico", { disableRunFileTypeWarning: true });
    const settings = makeSettings();
    const watcher = settings.watch();

    __changeConfig("micropico", { disableRunFileTypeWarning: false });

    assert.equal(settings.get("disableRunFileTypeWarning"), false);
    watcher.dispose();
  });

  test("keeps the cached values for changes of other extensions", () => {
    __setConfig("micropico", { disableRunFileTypeWarning: true });
    const settings = makeSettings();
    const watcher = settings.watch();

    // written without an event for micropico, so the snapshot stays
    __changeConfig("python", { defaultInterpreterPath: "/usr/bin/python3" });
    __setConfig("micropico", { disableRunFileTypeWarning: false });

    assert.equal(settings.get("disableRunFileTypeWarning"), true);
    watcher.dispose();
  });
});

describe("Settings.getCustomVidPidPairs", () => {
  beforeEach(() => {
    __resetConfig();
  });

  test("returns undefined when the setting is not an array", () => {
    __setConfig("micropico", { customVidPidPairs: undefined });
    assert.equal(makeSettings().getCustomVidPidPairs(), undefined);
  });

  test("returns an empty array when configured empty", () => {
    __setConfig("micropico", { customVidPidPairs: [] });
    assert.deepEqual(makeSettings().getCustomVidPidPairs(), []);
  });

  test("keeps only well-formed numeric {vid, pid} pairs", () => {
    __setConfig("micropico", {
      customVidPidPairs: [
        { vid: 1027, pid: 24592 },
        { vid: "x", pid: 1 },
        { vid: 1 },
        null,
        "nope",
        { vid: 2, pid: 3 },
      ],
    });

    assert.deepEqual(makeSettings().getCustomVidPidPairs(), [
      { vid: 1027, pid: 24592 },
      { vid: 2, pid: 3 },
    ]);
  });
});

// With the board filesystem mounted the window is a multi-root workspace, and
// settings read without a folder ignore the project's .vscode/settings.json.
describe("project folder (#361)", () => {
  let dir: string;

  beforeEach(() => {
    __resetConfig();
    dir = mkdtempSync(join(tmpdir(), "micropico-"));
  });

  function folder(name: string, micropico = false): string {
    const path = join(dir, name);
    mkdirSync(path);
    if (micropico) {
      writeFileSync(join(path, ".micropico"), "");
    }

    return path;
  }

  test("is never the mounted board filesystem", () => {
    const project = folder("project");
    __setWorkspaceFolders([
      { scheme: "pico", fsPath: "/" },
      { scheme: "file", fsPath: project },
    ]);

    assert.equal(getProjectWorkspaceFolder()?.uri.fsPath, project);
    rmSync(dir, { recursive: true });
  });

  test("prefers the folder with a .micropico file", () => {
    const docs = folder("docs");
    const project = folder("project", true);
    __setWorkspaceFolders([
      { scheme: "file", fsPath: docs },
      { scheme: "file", fsPath: project },
    ]);

    assert.equal(getProjectWorkspaceFolder()?.uri.fsPath, project);
    rmSync(dir, { recursive: true });
  });

  test("settings are read for the project folder", () => {
    const project = folder("project", true);
    __setWorkspaceFolders([
      { scheme: "file", fsPath: project },
      { scheme: "pico", fsPath: "/" },
    ]);

    const settings = makeSettings();
    settings.reload();

    const scopes = __getConfigScopes() as Array<{ fsPath: string } | undefined>;
    assert.ok(scopes.length > 0);
    assert.ok(scopes.every(scope => scope?.fsPath === project));
    rmSync(dir, { recursive: true });
  });
});

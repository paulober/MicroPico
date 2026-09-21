import { describe, test, beforeEach, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { PicoSerialEvents } from "@paulober/pico-mpy-com";
import { SettingsKey } from "../settings.mjs";
import { SessionContext } from "../commands/sessionContext.mjs";
import {
  commands,
  __resetPrompts,
  __resetCommands,
  __getQuickPickCalls,
  __queueQuickPick,
  __getShownWarnings,
} from "../test-support/vscodeStub.mjs";
import { ConnectionManager, type ConnectionDeps } from "./connectionManager.mjs";

// --- Fakes -----------------------------------------------------------------

/** Real EventEmitter so `on`/`off`/`emit`/`listenerCount` behave authentically. */
class FakeCom extends EventEmitter {
  public disconnected = true;
  public openCalls: string[] = [];
  public closeCalls = 0;
  public runCommandCalls: string[] = [];

  public isPortDisconnected(): boolean {
    return this.disconnected;
  }

  public openSerialPort(dev: string): Promise<void> {
    this.openCalls.push(dev);
    this.disconnected = false;

    return Promise.resolve();
  }

  public closeSerialPort(): Promise<void> {
    this.closeCalls++;
    this.disconnected = true;

    return Promise.resolve();
  }

  public runCommand(cmd: string): Promise<{ type: string }> {
    this.runCommandCalls.push(cmd);

    return Promise.resolve({ type: "none" });
  }
}

interface SettingsState {
  autoConnect?: boolean;
  manualComDevice?: string;
  executeOnConnect?: string;
  importOnConnect?: string;
}

function makeSettings(state: SettingsState): {
  reloadCount: number;
  getString(key: SettingsKey): string | undefined;
  getBoolean(key: SettingsKey): boolean;
  getCustomVidPidPairs(): undefined;
  reload(): void;
  update(key: SettingsKey, value: unknown): Promise<void>;
} {
  return {
    reloadCount: 0,
    getString(key: SettingsKey): string | undefined {
      switch (key) {
        case SettingsKey.manualComDevice:
          return state.manualComDevice;
        case SettingsKey.executeOnConnect:
          return state.executeOnConnect;
        case SettingsKey.importOnConnect:
          return state.importOnConnect;
        default:
          return undefined;
      }
    },
    getBoolean(key: SettingsKey): boolean {
      return key === SettingsKey.autoConnect ? (state.autoConnect ?? false) : false;
    },
    getCustomVidPidPairs(): undefined {
      return undefined;
    },
    reload(): void {
      this.reloadCount++;
    },
    update(key: SettingsKey, value: unknown): Promise<void> {
      if (key === SettingsKey.manualComDevice) {
        state.manualComDevice = value as string;
      }

      return Promise.resolve();
    },
  };
}

class FakeUi {
  public state = false;
  public refreshCalls: boolean[] = [];
  public operationOngoing = false;
  public stoppedCount = 0;
  public disconnectingCount = 0;

  public getState(): boolean {
    return this.state;
  }

  public refreshState(force: boolean): void {
    this.refreshCalls.push(force);
    this.state = force;
  }

  public isUserOperationOngoing(): boolean {
    return this.operationOngoing;
  }

  public userOperationStopped(): void {
    this.stoppedCount++;
  }

  public setDisconnecting(): void {
    this.disconnectingCount++;
  }

  public setBackgroundProgram(): void {}
}

class FakeTerminal {
  public freezeCount = 0;
  public cleanCount = 0;
  public writes: string[] = [];

  public freeze(): void {
    this.freezeCount++;
  }

  public clean(): void {
    this.cleanCount++;
  }

  public write(text: string): void {
    this.writes.push(text);
  }
}

interface FakeDeps extends ConnectionDeps {
  supportedQueue: string[][];
  listSupportedCalls: number;
  allPorts: string[];
  listAllCalls: number;
  usbMsdCalls: number;
  usbMsdReturn: boolean;
  onConnectedCalls: number;
}

function makeDeps(): FakeDeps {
  return {
    supportedQueue: [[]],
    listSupportedCalls: 0,
    allPorts: [],
    listAllCalls: 0,
    usbMsdCalls: 0,
    usbMsdReturn: true,
    onConnectedCalls: 0,
    listSupportedPorts(): Promise<string[]> {
      this.listSupportedCalls++;
      // shift through queued results, sticking on the last entry
      const value =
        this.supportedQueue.length > 1
          ? this.supportedQueue.shift()!
          : (this.supportedQueue[0] ?? []);

      return Promise.resolve(value);
    },
    listAllPorts(): Promise<string[]> {
      this.listAllCalls++;

      return Promise.resolve(this.allPorts);
    },
    async listPortDetails() {
      const supported = await this.listSupportedPorts();
      const all = await this.listAllPorts();

      return [...new Set([...supported, ...all])].map(path => ({
        path,
        supported: supported.includes(path),
      }));
    },
    checkForUsbMsd(): Promise<boolean> {
      this.usbMsdCalls++;

      return Promise.resolve(this.usbMsdReturn);
    },
    onConnected(): void {
      this.onConnectedCalls++;
    },
  };
}

interface Harness {
  cm: ConnectionManager;
  com: FakeCom;
  ui: FakeUi;
  terminal: FakeTerminal;
  deps: FakeDeps;
  ctx: SessionContext;
}

function makeHarness(state: SettingsState): Harness {
  const com = new FakeCom();
  const ui = new FakeUi();
  const terminal = new FakeTerminal();
  const deps = makeDeps();
  const ctx = new SessionContext(makeSettings(state) as never, com as never);
  ctx.ui = ui as never;
  ctx.terminal = terminal as never;
  const cm = new ConnectionManager(ctx, deps);

  return { cm, com, ui, terminal, deps, ctx };
}

/** Drain the microtask queue (real setImmediate is not among the mocked APIs). */
function flush(): Promise<void> {
  return new Promise<void>(resolve => setImmediate(resolve));
}

function enableTimers(t: TestContext): void {
  // enabling setInterval/setTimeout also intercepts their clear* counterparts
  t.mock.timers.enable({ apis: ["setInterval", "setTimeout"] });
}

// --- Tests -----------------------------------------------------------------

describe("ConnectionManager.setupAutoConnect", () => {
  beforeEach(() => {
    __resetPrompts();
    __resetCommands();
  });

  test("1: intentional disconnect is a one-shot that skips arming", async t => {
    enableTimers(t);
    const { cm, com, deps } = makeHarness({ autoConnect: true });
    com.disconnected = false; // so disconnect proceeds

    const pending = cm.disconnect(); // sets intentionalDisconnect synchronously

    // the flag makes the next setup a no-op that resets it, without arming
    assert.equal(cm.setupAutoConnect(), false);
    assert.equal(com.listenerCount(PicoSerialEvents.portClosed), 0);

    t.mock.timers.tick(1500);
    await flush();
    await pending;
    assert.equal(deps.listSupportedCalls, 0);
  });

  test("2: no manual device and auto-connect off does not arm a poller", async t => {
    enableTimers(t);
    const { cm, deps } = makeHarness({ autoConnect: false });

    assert.equal(cm.setupAutoConnect(), false);

    t.mock.timers.tick(1500);
    await flush();
    assert.equal(deps.listSupportedCalls, 0);
  });

  test("3: repeated calls never stack duplicate listeners", () => {
    const { cm, com } = makeHarness({ autoConnect: false });

    for (let i = 0; i < 4; i++) {
      cm.setupAutoConnect();
    }

    assert.equal(com.listenerCount(PicoSerialEvents.portError), 1);
    assert.equal(com.listenerCount(PicoSerialEvents.portClosed), 1);
    assert.equal(com.listenerCount(PicoSerialEvents.portOpened), 1);
  });

  test("4: re-arming never leaves overlapping intervals", async t => {
    enableTimers(t);
    const { cm, deps } = makeHarness({ autoConnect: true });
    deps.supportedQueue = [[]]; // always empty → interval keeps polling

    cm.setupAutoConnect();
    await flush();
    cm.setupAutoConnect(); // a second arm (as boardOnExit would do)
    await flush();

    deps.listSupportedCalls = 0; // ignore the immediate kicks
    t.mock.timers.tick(1500);
    await flush();
    // exactly one interval alive ⇒ exactly one poll per tick
    assert.equal(deps.listSupportedCalls, 1);

    t.mock.timers.tick(1500);
    await flush();
    assert.equal(deps.listSupportedCalls, 2);
  });

  test("5: auto branch connects to the first available port", async t => {
    enableTimers(t);
    const { cm, com, deps } = makeHarness({ autoConnect: true });
    deps.supportedQueue = [[], ["/dev/x"]];

    cm.setupAutoConnect();
    await flush(); // kick: no ports yet
    t.mock.timers.tick(1500);
    await flush(); // interval: port appears → connect

    assert.deepEqual(com.openCalls, ["/dev/x"]);
    assert.equal(cm.comDevice, "/dev/x");
  });

  test("6: reconnects to the previous device before ports[0]", async t => {
    enableTimers(t);
    const { cm, com, deps } = makeHarness({ autoConnect: true });
    cm.comDevice = "/dev/x";
    deps.supportedQueue = [["/dev/y", "/dev/x"]];

    cm.setupAutoConnect();
    await flush();

    assert.deepEqual(com.openCalls, ["/dev/x"]);
  });

  test("7: zero ports triggers the USB-MSD check exactly once", async t => {
    enableTimers(t);
    const { cm, deps } = makeHarness({ autoConnect: true });
    deps.supportedQueue = [[]];
    deps.usbMsdReturn = true;

    cm.setupAutoConnect();
    await flush(); // kick → check
    t.mock.timers.tick(1500);
    await flush(); // interval → gated, no second check
    t.mock.timers.tick(1500);
    await flush();

    assert.equal(deps.usbMsdCalls, 1);
  });

  test("8: manual branch connects only when the port exists", async t => {
    enableTimers(t);

    const present = makeHarness({
      autoConnect: false,
      manualComDevice: "/dev/m",
    });
    present.deps.allPorts = ["/dev/m"];
    present.cm.setupAutoConnect();
    await flush();
    assert.deepEqual(present.com.openCalls, ["/dev/m"]);

    const absent = makeHarness({
      autoConnect: false,
      manualComDevice: "/dev/m",
    });
    absent.deps.allPorts = ["/dev/other"];
    absent.cm.setupAutoConnect();
    await flush();
    assert.equal(absent.com.openCalls.length, 0);
  });

  test("8b: a manual device wins over auto-connect", async t => {
    enableTimers(t);
    const { cm, com, deps } = makeHarness({
      autoConnect: true,
      manualComDevice: "/dev/m",
    });
    deps.supportedQueue = [["/dev/detected"]];
    deps.allPorts = ["/dev/detected", "/dev/m"];

    cm.setupAutoConnect();
    await flush();

    assert.deepEqual(com.openCalls, ["/dev/m"]);
  });

  test("9: already connected stops polling immediately", async t => {
    enableTimers(t);
    const { cm, com, deps } = makeHarness({ autoConnect: true });
    com.disconnected = false;

    cm.setupAutoConnect();
    await flush();
    t.mock.timers.tick(1500);
    await flush();

    assert.equal(deps.listSupportedCalls, 0);
  });
});

describe("ConnectionManager board handlers", () => {
  beforeEach(() => {
    __resetPrompts();
    __resetCommands();
  });

  test("10: clean close stops the operation and re-arms", async t => {
    enableTimers(t);
    const { cm, com, ui, ctx } = makeHarness({ autoConnect: true });
    cm.setupAutoConnect();
    await flush();

    cm.comDevice = "/dev/x";
    com.disconnected = true;
    ui.operationOngoing = true;
    ctx.commandExecuting = true; // a command is mid-run

    com.emit(PicoSerialEvents.portClosed); // error === undefined → clean close

    assert.equal(ctx.commandExecuting, false);
    assert.equal(ui.stoppedCount, 1);
    assert.ok(ui.refreshCalls.includes(false));
    // re-armed: the close handler is still registered exactly once
    assert.equal(com.listenerCount(PicoSerialEvents.portClosed), 1);

    await flush();
  });

  test("11: board open is idempotent when already connected", () => {
    const { cm, com, ui, deps } = makeHarness({
      autoConnect: false,
      executeOnConnect: "boot()",
      importOnConnect: "mymod",
    });
    cm.setupAutoConnect(); // registers listeners
    ui.state = true; // UI already reports a connection

    com.emit(PicoSerialEvents.portOpened);

    assert.equal(deps.onConnectedCalls, 0);
    assert.equal(com.runCommandCalls.length, 0);
  });

  test("12: board open runs execute/importOnConnect and refreshes", () => {
    const { cm, com, ui, deps } = makeHarness({
      autoConnect: false,
      executeOnConnect: "boot()",
      importOnConnect: "mymod",
    });
    const remoteRunArgs: unknown[] = [];
    commands.registerCommand("micropico.remote.run", (...args: unknown[]) => {
      remoteRunArgs.push(...args);
    });
    cm.setupAutoConnect();
    ui.state = false;

    com.emit(PicoSerialEvents.portOpened);

    assert.deepEqual(remoteRunArgs, ["boot()", true]);
    assert.deepEqual(com.runCommandCalls, ["import mymod"]);
    assert.equal(ui.refreshCalls.at(-1), true);
    assert.equal(deps.onConnectedCalls, 1);
  });
});

describe("ConnectionManager.switchPico", () => {
  beforeEach(() => {
    __resetPrompts();
    __resetCommands();
  });

  test("13: zero ports errors and never shows an empty quick pick", async () => {
    const { cm, com, deps } = makeHarness({ autoConnect: false });
    deps.supportedQueue = [[]];

    await cm.switchPico();

    assert.equal(__getQuickPickCalls(), 0);
    assert.equal(com.openCalls.length, 0);
  });

  test("picking a port that isn't detected saves it", async () => {
    const state: SettingsState = { autoConnect: true };
    const { cm, com, deps } = makeHarness(state);
    deps.supportedQueue = [["/dev/pico"]];
    deps.allPorts = ["/dev/pico", "/dev/sparkfun"];
    __queueQuickPick({ label: "/dev/sparkfun", port: "/dev/sparkfun" });

    await cm.switchPico();

    assert.deepEqual(com.openCalls, ["/dev/sparkfun"]);
    assert.equal(state.manualComDevice, "/dev/sparkfun");
  });

  test("picking a detected board keeps auto detection", async () => {
    const state: SettingsState = { autoConnect: true };
    const { cm, com, deps } = makeHarness(state);
    deps.supportedQueue = [["/dev/pico"]];
    deps.allPorts = ["/dev/pico"];
    __queueQuickPick({ label: "/dev/pico", port: "/dev/pico" });

    await cm.switchPico();

    assert.deepEqual(com.openCalls, ["/dev/pico"]);
    assert.equal(state.manualComDevice, undefined);
  });

  test("'Detect boards automatically' clears the saved port", async () => {
    const state: SettingsState = { manualComDevice: "/dev/sparkfun" };
    const { cm, com, deps } = makeHarness(state);
    deps.allPorts = ["/dev/sparkfun"];
    __queueQuickPick({ label: "Detect boards automatically" });

    await cm.switchPico();

    assert.equal(com.openCalls.length, 0);
    assert.equal(state.manualComDevice, "");
  });
});

describe("ConnectionManager with a port in use", () => {
  beforeEach(() => {
    __resetPrompts();
    __resetCommands();
  });

  const lockError = new Error("Error Resource temporarily unavailable Cannot lock port");

  test("keeps retrying quietly for a moment, e.g. during a window reload", async t => {
    enableTimers(t);
    const { cm, com, deps } = makeHarness({ autoConnect: true });
    deps.supportedQueue = [["/dev/pico"]];
    cm.setupAutoConnect();
    await flush();

    for (let i = 0; i < 6; i++) {
      com.emit(PicoSerialEvents.portError, lockError);
    }

    assert.equal(__getShownWarnings().length, 0);
  });

  test("stops polling and tells the user once when the port stays busy", async t => {
    enableTimers(t);
    const { cm, com, deps } = makeHarness({ autoConnect: true });
    deps.supportedQueue = [["/dev/pico"]];
    // the port never opens
    com.openSerialPort = (dev: string): Promise<void> => {
      com.openCalls.push(dev);

      return Promise.resolve();
    };
    cm.setupAutoConnect();
    await flush();

    for (let i = 0; i < 10; i++) {
      com.emit(PicoSerialEvents.portError, lockError);
    }
    assert.equal(__getShownWarnings().length, 1);

    const attempts = com.openCalls.length;
    t.mock.timers.tick(10_000);
    await flush();
    assert.equal(com.openCalls.length, attempts);
  });

  test("never re-arms after dispose", () => {
    const { cm } = makeHarness({ autoConnect: true });
    cm.dispose();

    assert.equal(cm.setupAutoConnect(), false);
  });
});

describe("ConnectionManager.disconnect", () => {
  beforeEach(() => {
    __resetPrompts();
    __resetCommands();
  });

  test("14: disconnect clears the timer, flags intent and closes the port", async t => {
    enableTimers(t);
    const { cm, com, ui, deps } = makeHarness({ autoConnect: true });
    com.disconnected = false;

    const pending = cm.disconnect();
    assert.equal(ui.disconnectingCount, 1);

    t.mock.timers.tick(1500);
    await flush();
    await pending;

    assert.equal(com.closeCalls, 1);
    // intent flag consumed by the next setup (which therefore does not arm)
    assert.equal(cm.setupAutoConnect(), false);
    assert.equal(deps.listSupportedCalls, 0);
  });
});

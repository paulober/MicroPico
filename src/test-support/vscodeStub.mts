// Minimal stand-in for the `vscode` module so extension logic can be unit
// tested with node:test outside the Extension Host. A resolve hook maps the
// bare "vscode" specifier to this file (see test/vscode-loader.mjs). Only the
// surface touched by the modules under test is implemented.

type ConfigValues = Record<string, unknown>;

const store: Record<string, ConfigValues> = {};

/** Set the values a `getConfiguration(section)` will return. */
export function __setConfig(section: string, values: ConfigValues): void {
  store[section] = values;
}

/** Clear all configured sections between tests. */
export function __resetConfig(): void {
  for (const key of Object.keys(store)) {
    delete store[key];
  }
}

// Queued return values for interactive window prompts, so command logic that
// awaits a quick pick or save dialog can be driven deterministically.
const quickPickQueue: unknown[] = [];
const saveDialogQueue: unknown[] = [];

/** Queue values the next `showQuickPick` calls will resolve to, in order. */
export function __queueQuickPick(...values: unknown[]): void {
  quickPickQueue.push(...values);
}

/** Queue values the next `showSaveDialog` calls will resolve to, in order. */
export function __queueSaveDialog(...values: unknown[]): void {
  saveDialogQueue.push(...values);
}

/** Clear any queued prompt results between tests. */
export function __resetPrompts(): void {
  quickPickQueue.length = 0;
  saveDialogQueue.length = 0;
}

export const workspace = {
  getConfiguration(section: string) {
    return {
      get(key: string) {
        return store[section]?.[key];
      },
      update() {
        return Promise.resolve();
      },
    };
  },
  workspaceFolders: undefined,
};

export const window = {
  showErrorMessage() {
    return Promise.resolve(undefined);
  },
  showWarningMessage() {
    return Promise.resolve(undefined);
  },
  showInformationMessage() {
    return Promise.resolve(undefined);
  },
  showQuickPick() {
    return Promise.resolve(
      quickPickQueue.length > 0 ? quickPickQueue.shift() : undefined,
    );
  },
  showSaveDialog() {
    return Promise.resolve(
      saveDialogQueue.length > 0 ? saveDialogQueue.shift() : undefined,
    );
  },
  createOutputChannel() {
    // A LogOutputChannel whose level methods are no-ops.
    return {
      info() {},
      warn() {},
      error() {},
      debug() {},
      trace() {},
      append() {},
      appendLine() {},
      dispose() {},
    };
  },
};

const registeredCommands = new Map<string, (...args: unknown[]) => unknown>();

/** Clear commands registered via the stub between tests. */
export function __resetCommands(): void {
  registeredCommands.clear();
}

export const commands = {
  registerCommand(id: string, callback: (...args: unknown[]) => unknown) {
    registeredCommands.set(id, callback);

    return {
      dispose() {
        registeredCommands.delete(id);
      },
    };
  },
  executeCommand(id: string, ...args: unknown[]) {
    const callback = registeredCommands.get(id);

    return Promise.resolve(callback ? callback(...args) : undefined);
  },
};

export const extensions = {
  getExtension() {
    return undefined;
  },
};

export const env = {};

export class Uri {}

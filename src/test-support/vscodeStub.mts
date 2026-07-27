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
    return Promise.resolve(undefined);
  },
};

export const commands = {
  executeCommand() {
    return Promise.resolve(undefined);
  },
};

export const extensions = {
  getExtension() {
    return undefined;
  },
};

export const env = {};

export class Uri {}

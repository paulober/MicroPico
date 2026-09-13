// Test double for @paulober/pico-mpy-com so unit tests can import extension
// modules without pulling in the real serial library (and its native
// bindings). Only the surface the modules under test reference is provided.

export class PicoMpyCom {
  static getInstance(): PicoMpyCom {
    return new PicoMpyCom();
  }

  static getSerialPorts(): Promise<string[]> {
    return Promise.resolve([]);
  }

  static getAllSerialPorts(): Promise<string[]> {
    return Promise.resolve([]);
  }
}

// Mirrors the real enum's string values so listener registration in modules
// under test (e.g. ConnectionManager) resolves to the same keys a fake
// EventEmitter emits on. Kept in sync with the lib's picoSerialEvents.ts.
export const PicoSerialEvents = {
  portOpened: "portOpened",
  portClosed: "portClosed",
  portError: "portError",
  relayInput: "relayInput",
  relayInputError: "relayInputError",
  backgroundOutput: "backgroundOutput",
} as const;

// Mirrors the real enum's numeric values (the lib's operationResult.ts), so
// command modules that compare result types can be loaded under test.
export const OperationResultType = {
  none: 0,
  commandResponse: 1,
  commandResult: 2,
  listContents: 3,
  getItemStat: 4,
  getRtcTime: 5,
  tabComplete: 6,
} as const;

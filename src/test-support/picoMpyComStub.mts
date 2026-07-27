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

import type { PyboardRunner } from "@paulober/pyboard-serial-com";
import type Logger from "./logger.mjs";
import type UI from "./ui.mjs";
import type Stubs from "./stubs.mjs";
import type { PicoWFs } from "./filesystem.mjs";

export default interface StateContainer {
  logger: Logger;
  pyb?: PyboardRunner;
  ui?: UI;
  stubs?: Stubs;
  picoFs?: PicoWFs;

  autoConnectTimer?: NodeJS.Timer;
  comDevice?: string;
  commandExecuting?: boolean;
}

import { PicoMpyCom } from "@paulober/pico-mpy-com";
import type Settings from "../settings.mjs";
import type UI from "../ui.mjs";
import type { Terminal } from "../terminal.mjs";
import type { OutputRouter } from "../output/outputRouter.mjs";

/**
 * The single home for state shared across commands and the connection manager.
 * A reference to this object is injected into every {@link Command}, so the
 * many cross-command globals that used to live as scattered activator fields
 * are centralized here and shared by reference.
 *
 * Fields are added as the corresponding commands migrate onto the class-based
 * pattern; the reassigned flags (`pythonPath`, `comDevice`, `commandExecuting`)
 * move here together with the code that writes them, so there is never a stale
 * duplicate between the activator and this context.
 */
export class SessionContext {
  /** The shared MicroPython communication singleton. */
  public readonly com = PicoMpyCom.getInstance();

  /** Set once during activation, before any command can run. */
  public ui?: UI;
  public terminal?: Terminal;
  public output?: OutputRouter;

  public constructor(public readonly settings: Settings) {}
}

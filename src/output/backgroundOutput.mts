import { StringDecoder } from "string_decoder";
import type { SessionContext } from "../commands/sessionContext.mjs";

// how long the start of a line waits for the rest before it's shown anyway
const PARTIAL_LINE_FLUSH_MS = 200;

/**
 * Handles output the board sends while no command is running, typically from
 * a program that keeps running after Run (timers, interrupts, threads).
 *
 * The output is shown above the vREPL prompt and fed to the plotter, and the
 * program is marked as running so Stop and file operations can deal with it.
 */
export class BackgroundOutput {
  private readonly decoder = new StringDecoder("utf-8");
  private pending = "";
  private flushTimer?: NodeJS.Timeout;

  public constructor(private readonly ctx: SessionContext) {}

  public handle(data: Buffer): void {
    if (!this.ctx.backgroundProgram) {
      this.ctx.setBackgroundProgram(true);
    }
    this.ctx.output?.route(data);

    // show whole lines, so the prompt isn't redrawn in the middle of one
    this.pending += this.decoder.write(data);
    const lastNewline = this.pending.lastIndexOf("\n");
    if (lastNewline !== -1) {
      this.ctx.terminal?.writeAbovePrompt(this.pending.slice(0, lastNewline + 1));
      this.pending = this.pending.slice(lastNewline + 1);
    }

    clearTimeout(this.flushTimer);
    this.flushTimer =
      this.pending.length > 0
        ? setTimeout(() => this.flush(), PARTIAL_LINE_FLUSH_MS)
        : undefined;
  }

  /** Show an unfinished line, e.g. from `print(value, end="")`. */
  public flush(): void {
    clearTimeout(this.flushTimer);
    this.flushTimer = undefined;
    if (this.pending.length > 0) {
      this.ctx.terminal?.writeAbovePrompt(this.pending + "\r\n");
      this.pending = "";
    }
  }
}

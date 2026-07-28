import { window, type LogOutputChannel } from "vscode";

interface Stringable {
  toString(): string;
}

/**
 * Thin wrapper around a VS Code {@link LogOutputChannel}. Level filtering,
 * timestamps and per-level coloring are handled by VS Code itself; the user
 * chooses the verbosity via the log level selector in the Output panel.
 */
export default class Logger {
  private readonly className: string;
  private static channel: LogOutputChannel | undefined;

  constructor(className: string) {
    this.className = className;
  }

  private static get output(): LogOutputChannel {
    Logger.channel ??= window.createOutputChannel("MicroPico", { log: true });

    return Logger.channel;
  }

  public info(message: string, ...optionalParams: Stringable[]): void {
    Logger.output.info(`[${this.className}] ${message}`, ...optionalParams);
  }

  public warn(message: string, ...optionalParams: Stringable[]): void {
    Logger.output.warn(`[${this.className}] ${message}`, ...optionalParams);
  }

  public error(message: string | Error, ...optionalParams: Stringable[]): void {
    const text = message instanceof Error ? message.message : message;
    Logger.output.error(`[${this.className}] ${text}`, ...optionalParams);
  }

  public debug(message: string, ...optionalParams: Stringable[]): void {
    Logger.output.debug(`[${this.className}] ${message}`, ...optionalParams);
  }
}

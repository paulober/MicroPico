import { window } from "vscode";
import { type LogOutputChannel } from "vscode";

type LogLevel = "info" | "warn" | "error" | "debug";

// TODO: warn for production
const logLevel: LogLevel = "debug";

// ANSI escape code for red color
const red = "\x1b[31m";
const yellow = "\x1b[33m";
const magenta = "\x1b[35m";
// ANSI escape code to reset color
const reset = "\x1b[0m";

interface Stringable {
  toString(): string;
}

export default class Logger {
  private className: string;
  private static outputChannel?: LogOutputChannel;

  constructor(className: string) {
    this.className = className;

    // TODO: Does currently crash the auto reconnect after unplugging the device
    /*Logger.outputChannel = window.createOutputChannel("Pico-W-Go", {
        log: true,
      });*/
    //env.logLevel = customLogLevelToVscode(logLevel);
    Logger.outputChannel ??= window.createOutputChannel("MicroPico", {
      log: true,
    });
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];

    // eslint-disable-next-line @typescript-eslint/prefer-includes
    return levels.indexOf(level) >= levels.indexOf(logLevel);
  }

  public info(message: string, ...optionalParams: Stringable[]): void {
    if (this.shouldLog("info")) {
      if (Logger.outputChannel !== undefined) {
        Logger.outputChannel.info(`[${this.className}] ${message}`);
      } else {
        console.info(
          `[INFO] [${this.className}] ${message}`,
          ...optionalParams
        );
      }
    }
  }

  public warn(message: string, ...optionalParams: Stringable[]): void {
    if (this.shouldLog("warn")) {
      if (Logger.outputChannel !== undefined) {
        Logger.outputChannel.warn(`[${this.className}] ${message}`);
      } else {
        console.warn(
          `[${yellow}WARN${reset}] [${this.className}] ${message}`,
          ...optionalParams
        );
      }
    }
  }

  public error(message: string | Error, ...optionalParams: Stringable[]): void {
    if (this.shouldLog("error")) {
      if (message instanceof Error) {
        message = message.message;
      }
      if (Logger.outputChannel !== undefined) {
        Logger.outputChannel.error(`[${this.className}] ${message}`);
      } else {
        console.error(
          `[${red}ERROR${reset}] [${this.className}] ${message}`,
          ...optionalParams
        );
      }
    }
  }

  public debug(message: string, ...optionalParams: Stringable[]): void {
    if (this.shouldLog("debug")) {
      if (Logger.outputChannel !== undefined) {
        Logger.outputChannel.debug(
          `[${magenta}DEBUG${reset}] [${this.className}] ${message}`
        );
      } else {
        console.debug(
          `[DEBUG] [${this.className}] ${message}`,
          ...optionalParams
        );
      }
    }
  }
}

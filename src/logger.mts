import { LogLevel as vsLogLevel, LogOutputChannel, window } from "vscode";

type LogLevel = "info" | "warn" | "error" | "debug";

// TODOL: warn for production
const logLevel: LogLevel = "info";

// ANSI escape code for red color
const red = "\x1b[31m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const blue = "\x1b[34m";
const magenta = "\x1b[35m";
// ANSI escape code to reset color
const reset = "\x1b[0m";

export default class Logger {
  private className: string;
  private static outputChannel?: LogOutputChannel;

  constructor(className: string) {
    this.className = className;

    if (Logger.outputChannel === undefined) {
      // TODO: Does currently crash the auto reconnect after unplugging the device
      /*Logger.outputChannel = window.createOutputChannel("Pico-W-Go", {
        log: true,
      });*/
      Logger.outputChannel = window.createOutputChannel("Pico-W-Go", {
        log: true,
      });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(logLevel);
  }

  public info(message: string, ...optionalParams: any[]): void {
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

  public warn(message: string, ...optionalParams: any[]): void {
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

  public error(message: string | Error, ...optionalParams: any[]): void {
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

  public debug(message: string, ...optionalParams: any[]): void {
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

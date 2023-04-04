type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// TODOL: warn for production
const logLevel: LogLevel = 'debug';

// ANSI escape code for red color
const red = '\x1b[31m';
// ANSI escape code to reset color
const reset = '\x1b[0m';

export default class Logger {
  private className: string;

  constructor(className: string) {
    this.className = className;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(logLevel);
  }

  public info(message: string, ...optionalParams: any[]): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] [${this.className}] ${message}`, ...optionalParams);
    }
  }

  public warn(message: string, ...optionalParams: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] [${this.className}] ${message}`, ...optionalParams);
    }
  }

  public error(message: string | Error, ...optionalParams: any[]): void {
    if (this.shouldLog('error')) {
      if (message instanceof Error) {
        message = message.message;
      }
      console.error(`[${red}ERROR${reset}] [${this.className}] ${message}`, ...optionalParams);
    }
  }

  public debug(message: string, ...optionalParams: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] [${this.className}] ${message}`, ...optionalParams);
    }
  }
}

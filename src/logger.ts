import Config from './config';

let LOG_LEVEL = Config.constants().loggingLevel;
let LEVELS = ['silly', 'verbose', 'info', 'warning', 'error', 'critical'];

export default class Logger {
  className: string;

  constructor(className: string) {
    this.className = className;
  }

  private log(level: string, message: string, ...optionalParams: any[]) {
    if (LOG_LEVEL <= Logger.getLevel(level)) {
      console.log(
        `[${level}] [${this.className}] ${message}`,
        ...optionalParams
      );
    }
  }

  public silly(err: string | Error, ...optionalParams: any[]) {
    if (err instanceof Error) {
      this.log(LEVELS[0], err.message, ...optionalParams);
    } else {
      this.log(LEVELS[0], err, ...optionalParams);
    }
  }

  public verbose(err: string | Error, ...optionalParams: any[]) {
    if (err instanceof Error) {
      this.log(LEVELS[1], err.message, ...optionalParams);
    } else {
      this.log(LEVELS[1], err, ...optionalParams);
    }
  }

  public info(err: string | Error, ...optionalParams: any[]) {
    if (err instanceof Error) {
      this.log(LEVELS[2], err.message, ...optionalParams);
    } else {
      this.log(LEVELS[2], err, ...optionalParams);
    }
  }

  public warning(err: string | Error, ...optionalParams: any[]) {
    if (err instanceof Error) {
      this.log(LEVELS[3], err.message, ...optionalParams);
    } else {
      this.log(LEVELS[3], err, ...optionalParams);
    }
  }

  public error(err: string | Error, ...optionalParams: any[]) {
    if (err instanceof Error) {
      this.log(LEVELS[4], err.message, ...optionalParams);
    } else {
      this.log(LEVELS[4], err, ...optionalParams);
    }
  }

  public critical(err: string | Error, ...optionalParams: any[]) {
    if (err instanceof Error) {
      this.log(LEVELS[5], err.message, ...optionalParams);
    } else {
      this.log(LEVELS[5], err, ...optionalParams);
    }
  }

  public static getLevels(): typeof LEVELS {
    return LEVELS;
  }

  private static getLevel(level: string): number {
    return LEVELS.indexOf(level);
  }
}

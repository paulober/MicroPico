import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as util from "util";
import { promises as fsp } from "fs";
import SettingsWrapper, { SettingsKey } from "./settingsWrapper";
// * as rimraf without esModuleInterop
import rimraf from "rimraf";

let homeDir = os.homedir();

export default class Utils {
  settings: SettingsWrapper;
  allowedFileTypes: string[];
  private _rimraf: (arg1: string) => Promise<void>;

  constructor(settings: SettingsWrapper) {
    this.settings = settings;
    this.allowedFileTypes = this.settings.getAllowedFileTypes();
    this._rimraf = util.promisify(rimraf).bind(rimraf);
  }

  public base64decode(b64str: string): (String | Buffer[])[] {
    let content: string = "";
    let bufferList = [];
    let b64strArr = b64str.split("=");

    for (let i = 0; i < b64strArr.length; i++) {
      let chunk = b64strArr[i];
      if (chunk.length > 0) {
        // Add == to only the last chunk
        // Ignore last 2 items, becuase the original string contains '==' + some extra chars
        if (i === b64strArr.length - 3) {
          chunk += "==";
        } else {
          chunk += "=";
        }
        let bc = Buffer.from(chunk, "base64");
        bufferList.push(bc);
        content += bc.toString();
      }
    }
    return [content, bufferList];
  }

  public plural(text: string, num: number): string {
    return text + (num === 1 ? "" : "s");
  }

  public async ensureFileDirectoryExistence(filePath: string): Promise<boolean> {
    let dirname = path.dirname(filePath);
    return await this.ensureDirectoryExistence(dirname);
  }

  public async ensureDirectoryExistence(dirname: string): Promise<true> {
    if (!(await Utils.exists(dirname))) {
      await this.mkDirRecursive(dirname);
    }
    return true;
  }

  public async mkDirRecursive(directory: string): Promise<void> {
    if (!path.isAbsolute(directory)) {
      return;
    }

    let parent = path.join(directory, "..");

    if (parent !== path.join(path.sep) && !(await Utils.exists(parent))) {
      await this.mkDirRecursive(parent);
    }

    if (!(await Utils.exists(directory))) {
      await fsp.mkdir(directory);
    }
  }


  /**
   * Check if file or directory exists.
   * 
   * @param path Path to file
   * @returns true if path exists, false otherwise.
   */
  public static async exists(path: string): Promise<boolean> {
    try {
      await fsp.access(path, fs.constants.F_OK);
      return true;
    } catch (err) {
      return false;
    }
  }

  public ignoreFilter(fileList: any[]): any[] {
    let newList = [];
    for (let i = 0; i < fileList.length; i++) {
      let file = fileList[i];
      let filename = file.split("/").pop();
      if (
        file &&
        file !== "" &&
        file.length > 0 &&
        file.substring(0, 1) !== "."
      ) {
        if (
          file.indexOf(".") === -1 ||
          this.settings.get(SettingsKey.syncAllFileTypes) ||
          this.allowedFileTypes.indexOf(file.split(".").pop()) > -1
        ) {
          if (
            (this.settings.get(SettingsKey.pyIgnore) as string[]).indexOf(file) === -1 &&
            (this.settings.get(SettingsKey.pyIgnore) as string[]).indexOf(filename) === -1
          ) {
            newList.push(file);
          }
        }
      }
    }
    return newList;
  }

  public async rmdir(path: string): Promise<void> {
    await this._rimraf(path);
  }

  public static getConfigPath(filename?: string) {
    let folder =
      process.env.APPDATA ||
      (process.platform === "darwin"
        ? process.env.HOME + "/Library/Application Support"
        : process.platform === "linux"
        ? Utils.joinPath(homeDir, ".config")
        : "/var/local");
    if (/^[A-Z]\:[/\\]/.test(folder)) {
      folder = folder.substring(0, 1).toLowerCase() + folder.substring(1);
    }
    return Utils.joinPath(folder, "/Code/User/", filename ? filename : "");
  }

  public static joinPath(...args: string[]) {
    let p = "";
    for (let i = 0; i < args.length; i++) {
      p = path.join(p, args[i]);
    }
    return Utils.normalize(p);
  }

  public static normalize(p: string) {
    return path.normalize(p).replace(/\\/g, "/");
  }

  public static async sleep(timeout: number) {
    await new Promise((resolve) => setTimeout(resolve, timeout));
  }
}

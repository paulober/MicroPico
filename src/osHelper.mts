import { lstat } from "fs";
import { readFile, stat, writeFile } from "fs/promises";
import { rimrafSync } from "rimraf";

export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);

    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile<T>(path: string): Promise<T | undefined> {
  try {
    const content = await readFile(path, {
      encoding: "utf8",
      flag: "r",
    });

    return JSON.parse(content) as T;
  } catch {
    return undefined;
  }
}

export async function writeJsonFile<T>(
  path: string,
  content: T
): Promise<void> {
  try {
    const json = JSON.stringify(content, null, 4);

    await writeFile(path, json, {
      encoding: "utf8",
      flag: "w",
    });
  } catch (e) {
    const message =
      typeof e === "string" ? e : e instanceof Error ? e.message : "";
    console.error(
      `[MicroPico] [OSHelper] Error writing to ${path}: ${message}`
    );
  }
}

export function removeJunction(junctionPath: string): Promise<boolean> {
  return new Promise(resolve => {
    lstat(junctionPath, (err, stats) => {
      if (err) {
        //reject(err);
        resolve(false);
      } else if (stats.isSymbolicLink()) {
        const result = rimrafSync(junctionPath);
        resolve(result);
      } else {
        //reject(new Error(`${junctionPath} is not a directory junction.`));
        resolve(false);
      }
    });
  });
}

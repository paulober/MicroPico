import { lstat, readdirSync } from "fs";
import { readFile, stat, writeFile } from "fs/promises";
import { basename, join } from "path";
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

/**
 * Searches for a file in a directory and its subdirectories.
 *
 * @param directory The directory to search in.
 * @param fileName The name of the file to search for.
 * @returns The path to the file if found, otherwise undefined.
 */
export function searchFile(
  directory: string,
  fileName: string
): string | undefined {
  const contents = readdirSync(directory, {
    encoding: "utf8",
    recursive: true,
  });

  const file = contents.find(c => basename(c) === fileName);

  return file ? join(directory, file) : undefined;
}

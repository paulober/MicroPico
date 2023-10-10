import { readFile, stat, writeFile } from "fs/promises";

export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);

    return true;
  } catch (error) {
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
  } catch (error) {
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

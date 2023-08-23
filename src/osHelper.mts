import {
  PythonExtension,
  type ResolvedEnvironment,
} from "@vscode/python-extension";
import { exec } from "child_process";
import { readFile, stat, writeFile } from "fs/promises";
import type { Uri } from "vscode";
import { resolveVariables } from "./settings.mjs";

export interface IInterpreterDetails {
  path?: string[];
  resource?: Uri;
}

function checkVersion(environment: ResolvedEnvironment): boolean {
  const version = environment.version;

  if (version?.major === 3 && version?.minor >= 9) {
    return true;
  }

  return false;
}

export async function getPythonCommand(
  resource?: Uri
): Promise<IInterpreterDetails> {
  const pyApi: PythonExtension = await PythonExtension.api();

  const environment = await pyApi.environments.resolveEnvironment(
    pyApi.environments.getActiveEnvironmentPath(resource)
  );
  if (environment?.executable.uri && checkVersion(environment)) {
    return {
      path: resolveVariables([environment.executable.uri.fsPath], resource),
      resource,
    };
  }

  return { path: undefined, resource };
}

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

export async function isPyserialInstalled(pyCommand: string): Promise<boolean> {
  return new Promise(resolve => {
    exec(
      `${pyCommand} -m pip show pyserial`,
      { timeout: 5000 },
      (error, stdout) => {
        if (error) {
          console.error(
            "[MicroPico] Failed to check if pyserial is installed: ",
            error?.message
          );
        } else {
          resolve(stdout.includes("Name: pyserial"));
        }
      }
    );
  });
}

export async function installPyserial(pyCommand: string): Promise<boolean> {
  return new Promise(resolve => {
    exec(
      `${pyCommand} -m pip install --upgrade pyserial`,
      { timeout: 10000, windowsHide: true },
      (error, stdout) => {
        if (error || stdout.includes("ERROR: ")) {
          console.error("[MicroPico] Failed to install pyserial: ", error);
        } else {
          console.log("[MicroPico] pyserial installed successfully");
        }

        resolve(true);
      }
    );
  });
}

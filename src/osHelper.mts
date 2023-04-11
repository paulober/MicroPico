import { exec, execSync } from "child_process";
import { readFile, stat, writeFile } from "fs/promises";
import { platform } from "os";

const pythonCommands = {
  win32: "python.exe",
  darwin: "python3",
  linux: "python3",
};

export async function getPythonCommand(): Promise<string | undefined> {
  const currentPlatform = platform() as keyof typeof pythonCommands;

  if (currentPlatform in pythonCommands === false) {
    console.error(`Unsupported platform: ${currentPlatform}`);
    return;
  }

  const pythonCommand: string | undefined = pythonCommands[currentPlatform];

  return new Promise(resolve => {
    exec(
      `${pythonCommand} --version`,
      { timeout: 1000 },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing ${pythonCommand}: ${error.message}`);
          resolve(undefined);
        } else {
          console.debug(`Python version: ${stdout || stderr}`);
          resolve(pythonCommand);
        }
      }
    );
  });
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    return false;
  }
}

export async function readJsonFile(path: string): Promise<any> {
  try {
    const content = await readFile(path, {
      encoding: "utf8",
      flag: "r",
    });

    return JSON.parse(content);
  } catch (error) {
    return undefined;
  }
}

export async function writeJsonFile(path: string, content: any): Promise<void> {
  try {
    const json = JSON.stringify(content, null, 4);

    await writeFile(path, json, {
      encoding: "utf8",
      flag: "w",
    });
  } catch (error) {
    console.error(`[Pico-W-Go] [OSHelper] Error writing to ${path}: ${error}`);
  }
}

export function isPyserialInstalled(pyCommand: string): boolean {
  try {
    const output = execSync(`${pyCommand} -m pip show pyserial`);
    return output.toString().includes("Name: pyserial");
  } catch (error) {
    return false;
  }
}

export function installPyserial(pyCommand: string): void {
  try {
    execSync(`${pyCommand} -m pip install pyserial`);
    console.log("[Pico-W-Go] pyserial installed successfully");
  } catch (error) {
    console.error("[Pico-W-Go] Failed to install pyserial", error);
  }
}

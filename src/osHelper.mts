import { exec } from "child_process";
import {
  access,
  constants as fsConstants,
  readFile,
  writeFile,
} from "fs/promises";
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
    exec(`${pythonCommand} --version`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing ${pythonCommand}: ${error.message}`);
        resolve(undefined);
      } else {
        console.debug(`Python version: ${stdout || stderr}`);
        resolve(pythonCommand);
      }
    });
  });
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

export async function readJsonFile(path: string): Promise<any> {
  try {
    const content = await readFile(path, {
      encoding: "utf8",
      flag: fsConstants.O_RDONLY,
    });

    return JSON.parse(content);
  } catch (error) {
    return undefined;
  }
}

export async function writeJsonFile(path: string, content: any): Promise<void> {
  try {
    const json = JSON.stringify(content, null, 4);

    writeFile(path, json, { encoding: "utf8", flag: fsConstants.O_CREAT });
  } catch (error) {}
}

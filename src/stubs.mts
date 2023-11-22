import { commands, window } from "vscode";
import { join, resolve } from "path";
import {
  getProjectPath,
  getVsCodeUserPath,
  recommendedExtensions,
  shouldRecommendExtensions,
} from "./api.mjs";
import { mkdir, readdir, symlink } from "fs/promises";
import {
  pathExists,
  readJsonFile,
  removeJunction,
  writeJsonFile,
} from "./osHelper.mjs";
import { copy, emptyDir, mkdirpSync } from "fs-extra";
import Logger from "./logger.mjs";
import _ from "lodash";
import which from "which";
import { execSync } from "child_process";
import axios, { HttpStatusCode } from "axios";

export default class Stubs {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("Stubs");
  }

  public async update(): Promise<void> {
    const configFolder = getVsCodeUserPath();
    const installedStubsFolder = join(configFolder, "Pico-W-Stub");

    if (!(await pathExists(join(installedStubsFolder, "version.json")))) {
      // ensure config folder exists
      await mkdir(configFolder, { recursive: true });

      let installedVersion = "";
      let currentVersion = "";

      if (await pathExists(installedStubsFolder)) {
        const installedMatchingFolders = (
          await readdir(installedStubsFolder)
        ).filter(name => name.match(/micropython_rp2.*\.dist-info/));

        if (installedMatchingFolders.length > 0) {
          installedVersion = installedMatchingFolders[0];
        }
      }

      const currentFolder = join(__dirname, "..", "mpy_stubs");

      if (await pathExists(currentFolder)) {
        const currentMatchingFolders = (await readdir(currentFolder)).filter(
          name => name.match(/micropython_rp2.*\.dist-info/)
        );

        if (currentMatchingFolders.length > 0) {
          currentVersion = currentMatchingFolders[0];
        }
      }

      // Check if the existing version file exists and if the version is the same
      if (installedVersion === currentVersion) {
        this.logger.info("Installed stubs are already up to date!");

        return;
      }
    }

    try {
      // update stubs folder
      await emptyDir(installedStubsFolder);
      await copy(join(__dirname, "..", "mpy_stubs"), installedStubsFolder);

      this.logger.info("Updated stubs successfully!");
    } catch (error) {
      const msg: string =
        typeof error === "string" ? error : (error as Error).message;
      this.logger.error(`Updating stubs failed: ${msg}`);
    }

    return;
  }

  public async addToWorkspace(): Promise<void> {
    const workspace = getProjectPath();

    // no folfer opened in vscode
    if (!workspace) {
      void window.showErrorMessage(
        "You need to open your project folder in " +
          "VS Code before you can configure it!"
      );

      return;
    }

    // the path to the .vscode folder in the project folder
    const vsc = join(workspace, ".vscode");

    // check if .vscode folder exists if not create it
    if (!(await pathExists(vsc))) {
      await mkdir(vsc);
    }

    await this.addStubs(vsc);
    await this.addExtensions(vsc);
    await this.addSettings(vsc);
    await this.addProjectFile(workspace);

    void window.showInformationMessage("Project configuration complete!");

    if (shouldRecommendExtensions()) {
      void commands.executeCommand(
        "workbench.extensions.action.showRecommendedExtensions"
      );
    }
  }

  /**
   * Add stubs to the VS Code user folder
   *
   * @param vsc The path to the vscode config folder in current workspace
   */
  private async addStubs(vsc: string): Promise<void> {
    const stubsPath = join(vsc, "Pico-W-Stub");
    if (!(await pathExists(stubsPath))) {
      const configFolder = getVsCodeUserPath();
      await symlink(
        resolve(join(configFolder, "Pico-W-Stub")),
        stubsPath,
        "junction"
      );
    }
  }

  private async addExtensions(vsc: string): Promise<void> {
    const extensionsFilePath = join(vsc, "extensions.json");

    // Option for adding recommended extensions in a included extensions.json file
    const extensions =
      ((await readJsonFile(extensionsFilePath)) as {
        recommendations: string[];
      }) || {};
    extensions.recommendations = _.union(
      extensions.recommendations || [],
      recommendedExtensions
    );
    await writeJsonFile(extensionsFilePath, extensions);
  }

  private async addSettings(
    vsc: string,
    justUpdate: boolean = false
  ): Promise<void> {
    const settingsFilePath = join(vsc, "settings.json");
    const stubsPath = join(".vscode", "Pico-W-Stub");
    const defaultSettings: { [key: string]: string | boolean | object } = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "python.linting.enabled": true,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "python.languageServer": "Pylance",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "python.analysis.typeCheckingMode": "basic",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "python.analysis.diagnosticSeverityOverrides": {
        reportMissingModuleSource: "none",
      },
    };

    if (!justUpdate) {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      defaultSettings["micropico.syncFolder"] = "";
      // eslint-disable-next-line @typescript-eslint/naming-convention
      defaultSettings["micropico.openOnStart"] = true;
    }

    interface ISettings {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "python.analysis.typeshedPaths": string[];
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "python.analysis.extraPaths": string[];
    }

    let settings = ((await readJsonFile(settingsFilePath)) as ISettings) || {};
    settings = _.defaults(settings, defaultSettings);

    settings["python.analysis.typeshedPaths"] = _.union(
      settings["python.analysis.typeshedPaths"] || [],
      [stubsPath]
    );
    settings["python.analysis.extraPaths"] = _.union(
      settings["python.analysis.extraPaths"] || [],
      [stubsPath]
    );

    await writeJsonFile(settingsFilePath, settings);
  }

  private async addProjectFile(workspace: string): Promise<void> {
    const localProjectFile = join(workspace, ".micropico");

    if (!(await pathExists(localProjectFile))) {
      await writeJsonFile(localProjectFile, {
        info: "This file is just used to identify a project folder.",
      });
    }
  }
}

/**
 * Install the included stubs to current Pico project.
 *
 * @returns
 */
export async function installIncludedStubs(): Promise<void> {
  const workspaceFolder = getProjectPath();
  if (workspaceFolder === undefined) {
    return;
  }
  const vsc = join(workspaceFolder, ".vscode");
  const stubsPath = join(vsc, "Pico-W-Stub");
  if (await pathExists(stubsPath)) {
    await removeJunction(stubsPath);
  }
  const configFolder = getVsCodeUserPath();
  await symlink(
    resolve(join(configFolder, "Pico-W-Stub")),
    stubsPath,
    "junction"
  );
}

const STUB_PORTS = [
  "micropython-rp2-rpi_pico_w-stubs",
  "micropython-rp2-rpi_pico-stubs",
  "micropython-esp32-stubs",
];

export function stubPortToDisplayString(port: string): string {
  switch (port) {
    case "micropython-rp2-rpi_pico_w-stubs":
      return "RPi Pico (W)";
    case "micropython-rp2-rpi_pico-stubs":
      return "RPi Pico";
    case "micropython-esp32-stubs":
      return "ESP32";
    default:
      return port;
  }
}

export function displayStringToStubPort(displayString: string): string {
  switch (displayString) {
    case "RPi Pico (W)":
      return "micropython-rp2-rpi_pico_w-stubs";
    case "RPi Pico":
      return "micropython-rp2-rpi_pico-stubs";
    case "ESP32":
      return "micropython-esp32-stubs";
    default:
      return displayString;
  }
}

// TODO: option to choose stubs distrbution
export async function installStubsByVersion(
  version: string,
  port: string
): Promise<boolean> {
  // check if pip is available
  const pip: string | null = await which("pip", { nothrow: true });

  if (pip === null) {
    void window.showErrorMessage(
      "pip is required (in PATH) to install" +
        " stubs different from the included ones."
    );

    return false;
  }

  const configFolder = getVsCodeUserPath();
  const target = resolve(
    join(configFolder, "MicroPico-Stubs", `${port}==${version}`)
  );
  mkdirpSync(target);

  // install stubs with pip vscode user directory
  const result = execSync(
    `${pip} install ${port}==${version} ` + `--target "${target}" --no-user`
  );

  // check result
  if (result.toString("utf-8").includes("Successfully installed")) {
    const workspaceFolder = getProjectPath();
    if (workspaceFolder === undefined) {
      return false;
    }
    const vsc = join(workspaceFolder, ".vscode");
    const stubsPath = join(vsc, "Pico-W-Stub");
    // delete stubsPath folder if it exists
    if (await pathExists(stubsPath)) {
      await removeJunction(stubsPath);
    }

    // relink
    await symlink(target, stubsPath, "junction");

    return true;
  }

  return false;
}

// TODO: support for other stubs distributions
export async function fetchAvailableStubsVersions(): Promise<{
  [key: string]: string[];
}> {
  const versions: { [key: string]: string[] } = {};

  for (const port of STUB_PORTS) {
    const stubsVersions = await fetchAvailableStubsVersionsForPort(port);

    versions[port] = stubsVersions.reverse();
  }

  return versions;
}

async function fetchAvailableStubsVersionsForPort(
  port: string
): Promise<string[]> {
  try {
    const response = await axios.get(`https://pypi.org/pypi/${port}/json`);

    if (response.status === HttpStatusCode.Ok.valueOf()) {
      const releases = (
        response.data as { releases: { [key: string]: object } }
      ).releases;

      return Object.keys(releases);
    }
  } catch (error) {
    //const msg: string =
    //  typeof error === "string" ? error : (error as Error).message;
    // console.error(`Fetching available stubs versions failed: ${msg}`);
  }

  return [];
}

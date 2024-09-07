import { commands, window } from "vscode";
import { join } from "path";
import {
  getProjectPath,
  getStubsPathForVersion,
  getStubsPathForVersionPosix,
  recommendedExtensions,
  settingsStubsPathForVersion,
  shouldRecommendExtensions,
} from "./api.mjs";
import { mkdir, readdir } from "fs/promises";
import {
  pathExists,
  readJsonFile,
  removeJunction,
  writeJsonFile,
} from "./osHelper.mjs";
import { copy, emptyDir, mkdirpSync } from "fs-extra";
import Logger from "./logger.mjs";
// eslint-disable-next-line @typescript-eslint/naming-convention
import _ from "lodash";
import which from "which";
import { execSync } from "child_process";
import axios, { HttpStatusCode } from "axios";
import type Settings from "./settings.mjs";
import { strict as assert } from "assert";

export default class Stubs {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("Stubs");
  }

  /**
   * Update localy installed included stubs to the latest version.
   *
   * @returns
   */
  public async update(settings: Settings): Promise<void> {
    const installedStubsFolder = getStubsPathForVersion("included");

    if (!(await pathExists(join(installedStubsFolder, "version.json")))) {
      // ensure config folder exists
      await mkdir(installedStubsFolder, { recursive: true });

      let installedVersion = "";
      let currentVersion = "";

      if (await pathExists(installedStubsFolder)) {
        const installedMatchingFolders = (
          await readdir(installedStubsFolder)
        ).filter(name => /micropython_rp2.*\.dist-info/.exec(name));

        if (installedMatchingFolders.length > 0) {
          installedVersion = installedMatchingFolders[0];
        }
      }

      const currentFolder = join(__dirname, "..", "mpy_stubs");

      if (await pathExists(currentFolder)) {
        const currentMatchingFolders = (await readdir(currentFolder)).filter(
          name => /micropython_rp2.*\.dist-info/.exec(name)
        );

        if (currentMatchingFolders.length > 0) {
          currentVersion = currentMatchingFolders[0];
        }
      }

      // Check if the existing version file exists and if the version is the same
      if (installedVersion === currentVersion) {
        this.logger.info("Installed stubs are already up to date!");

        // TODO: remove in future versions, only to convert legacy projects
        const workspace = getProjectPath();
        if (workspace) {
          await this.removeLegacyStubs(join(workspace, ".vscode"), settings);
        }

        return;
      }
    }

    try {
      // update stubs folder
      await emptyDir(installedStubsFolder);
      await copy(join(__dirname, "..", "mpy_stubs"), installedStubsFolder);

      this.logger.info("Updated stubs successfully!");

      // TODO: remove in future versions, only to convert legacy projects
      const workspace = getProjectPath();
      if (workspace) {
        await this.removeLegacyStubs(join(workspace, ".vscode"), settings);
      }
    } catch (error) {
      const msg: string =
        typeof error === "string" ? error : (error as Error).message;
      this.logger.error(`Updating stubs failed: ${msg}`);
    }

    return;
  }

  public async addToWorkspace(location?: string): Promise<void> {
    const workspace = location ? location : getProjectPath();

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

    await this.removeLegacyStubs(vsc);
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
   * Remove stubs junction from the VS Code workspace folder
   *
   * @param vsc The path to the vscode config folder in current workspace
   */
  private async removeLegacyStubs(
    vsc: string,
    settings: Settings | undefined = undefined
  ): Promise<void> {
    const stubsPath = join(vsc, "Pico-W-Stub");
    if (await pathExists(stubsPath)) {
      await removeJunction(stubsPath);

      if (settings) {
        await installIncludedStubs(settings);
      }
    }
  }

  private async addExtensions(vsc: string): Promise<void> {
    const extensionsFilePath = join(vsc, "extensions.json");

    // Option for adding recommended extensions in a included extensions.json file
    const extensions = (await readJsonFile<{
      recommendations: string[];
    }>(extensionsFilePath)) ?? { recommendations: [] };
    extensions.recommendations = _.union(
      extensions.recommendations || [],
      recommendedExtensions
    );
    await writeJsonFile(extensionsFilePath, extensions);
  }

  private async addSettings(vsc: string, justUpdate = false): Promise<void> {
    const settingsFilePath = join(vsc, "settings.json");
    const stubsPath = settingsStubsPathForVersion("included");
    const defaultSettings: Record<string, string | boolean | object> = {
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
      // this should stop the python extension
      // from pasting activation stuff into the vREPL
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "python.terminal.activateEnvironment": false,
    };

    if (!justUpdate) {
      defaultSettings["micropico.syncFolder"] = "";
      defaultSettings["micropico.openOnStart"] = true;
    }

    interface ISettings {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "python.analysis.typeshedPaths": string[];
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "python.analysis.extraPaths": string[];
    }

    let settings =
      (await readJsonFile<ISettings>(settingsFilePath)) ?? ({} as ISettings);
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
export async function installIncludedStubs(settings: Settings): Promise<void> {
  await settings.updateStubsPath(settingsStubsPathForVersion("included"));
}

enum StubPorts {
  picoW = "micropython-rp2-rpi_pico_w-stubs",
  pico = "micropython-rp2-rpi_pico-stubs",
  esp32 = "micropython-esp32-stubs",
  esp32s3 = "micropython-esp32-esp32_generic_s3-stubs",
}

export const STUB_PORTS: string[] = [
  StubPorts.picoW,
  StubPorts.pico,
  StubPorts.esp32,
  StubPorts.esp32s3,
];

export function stubPortToDisplayString(port: string): string {
  switch (port) {
    case StubPorts.picoW as string:
      return "RPi Pico (W)";
    case StubPorts.pico as string:
      return "RPi Pico";
    case StubPorts.esp32 as string:
      return "ESP32";
    case StubPorts.esp32s3 as string:
      return "ESP32S3";
    default:
      return port;
  }
}

export function displayStringToStubPort(displayString: string): string {
  switch (displayString) {
    case "RPi Pico (W)":
      return StubPorts.picoW;
    case "RPi Pico":
      return StubPorts.pico;
    case "ESP32":
      return StubPorts.esp32;
    case "ESP32S3":
      return StubPorts.esp32s3;
    default:
      return displayString;
  }
}

// TODO: option to choose stubs distrbution
export async function installStubsByVersion(
  version: string,
  port: string,
  settings: Settings
): Promise<boolean> {
  const pip3: string | null = await which("pip3", { nothrow: true });
  // check if pip is available
  const pip: string | null = await which("pip", { nothrow: true });

  let command = "";
  // if not available check for python prefixed installations
  if (pip3 === null && pip === null) {
    const python3: string | null = await which("python3", { nothrow: true });
    // windows py launcher
    const py: string | null = await which("py", { nothrow: true });

    // if (py ?? python) -m pip returns sth containing "No module named" -> not installed

    const pyCmd = python3 ?? py;
    if (pyCmd !== null) {
      // TODO: check windows pylauncher compatibility
      const result = execSync(pyCmd + " -m pip");
      if (result.toString("utf-8").toLowerCase().includes("no module named")) {
        void window.showErrorMessage(
          `pip module is required (in ${pyCmd}) to install` +
            " stubs different from the included ones."
        );

        return false;
      }
      command = `${pyCmd} -m pip`;
    } else {
      void window.showErrorMessage(
        "python3 or py is required (in PATH) to install" +
          " stubs different from the included ones."
      );

      return false;
    }
  } else {
    assert(pip3 !== null || pip !== null);
    command = (pip3 ?? pip)!;
  }

  const folderName = `${port}==${version}`;
  const target = getStubsPathForVersionPosix(folderName);
  mkdirpSync(target);

  const isWin = process.platform === "win32";
  // install stubs with pip vscode user directory
  const result = execSync(
    `${isWin ? "&" : ""}"${command}" install ${port}==${version} ` +
      `--target "${target}" --no-user`,
    isWin ? { shell: "powershell" } : {}
  );

  // check result
  if (
    result.toString("utf-8").toLowerCase().includes("successfully installed")
  ) {
    return settings.updateStubsPath(settingsStubsPathForVersion(folderName));
  }

  return false;
}

export async function installStubsByPipVersion(
  pipPackageWithVersion: string,
  settings: Settings
): Promise<boolean> {
  const versionParts = pipPackageWithVersion.split("==");
  if (versionParts.length !== 2) {
    return false;
  }

  return installStubsByVersion(versionParts[1], versionParts[0], settings);
}

export async function fetchAvailableStubsVersions(
  displayPort?: string
): Promise<Record<string, string[]>> {
  const versions: Record<string, string[]> = {};

  if (displayPort !== undefined) {
    const stubPort = displayStringToStubPort(displayPort);
    const stubsVersions = await fetchAvailableStubsVersionsForPort(stubPort);

    versions[stubPort] = stubsVersions.reverse();
  } else {
    for (const port of STUB_PORTS) {
      const stubsVersions = await fetchAvailableStubsVersionsForPort(port);

      versions[port] = stubsVersions.reverse();
    }
  }

  return versions;
}

async function fetchAvailableStubsVersionsForPort(
  port: string
): Promise<string[]> {
  try {
    const response = await axios.get(`https://pypi.org/pypi/${port}/json`);

    if (response.status === HttpStatusCode.Ok.valueOf()) {
      const releases = (response.data as { releases: Record<string, object> })
        .releases;

      return Object.keys(releases);
    }
  } catch {
    //const msg: string =
    //  typeof error === "string" ? error : (error as Error).message;
    // console.error(`Fetching available stubs versions failed: ${msg}`);
  }

  return [];
}

export async function stubsInstalled(
  settings: Settings
): Promise<string | null> {
  const selectedStubsVersion = settings.getSelectedStubsVersion();
  if (
    selectedStubsVersion?.toLowerCase() === "included" ||
    selectedStubsVersion === undefined
  ) {
    return null;
  }

  return !(await pathExists(getStubsPathForVersion(selectedStubsVersion)))
    ? selectedStubsVersion
    : null;
}

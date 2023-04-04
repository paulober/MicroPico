import path from "path";
import {
  getProjectPath,
  getVsCodeUserPath,
  recommendedExtensions,
  shouldRecommendExtensions,
} from "./api";
import { mkdir, readFile, symlink } from "fs/promises";
import { pathExists, readJsonFile, writeJsonFile } from "./osHelper";
import { copy, emptyDir } from "fs-extra";
import Logger from "./logger";
import _ from "lodash";
import { commands, window } from "vscode";

export default class Stubs {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("Stubs");
  }

  public async update(): Promise<void> {
    const configFolder = getVsCodeUserPath();
    const stubsFolder = path.join(configFolder, "Pico-W-Stubs");

    // ensure config folder exists
    await mkdir(configFolder, { recursive: true });

    const existingVersionFile = path.join(stubsFolder, "version.txt");
    const currentVersionFile = path.resolve(
      path.join(__dirname, "..", "stubs", "version.json")
    );

    const currentVersion = JSON.parse(
      await readFile(currentVersionFile, "utf8")
    );

    // Check if the existing version file exists and if the version is the same
    if (await pathExists(existingVersionFile)) {
      const existingVersion = JSON.parse(
        await readFile(existingVersionFile, "utf8")
      );

      if (existingVersion.version === currentVersion.version) {
        return;
      }
    }

    try {
      // update stubs folder
      await emptyDir(stubsFolder);
      await copy(path.join(__dirname, "..", "stubs"), stubsFolder);
    } catch (error) {
      const msg: string =
        typeof error === "string" ? error : (error as Error).message;
      this.logger.error(`Updating stubs failed: ${msg}`);
    }
    return;
  }

  public async addToWorkspace() {
    const workspace = getProjectPath();

    // no folfer opened in vscode
    if (!workspace) {
      window.showErrorMessage(
        "You need to open your project folder in VS Code before you can configure it!"
      );
      return;
    }

    // the path to the .vscode folder in the project folder
    let vsc = path.join(workspace, ".vscode");

    // check if .vscode folder exists if not create it
    if (!(await pathExists(vsc))) {
      await mkdir(vsc);
    }

    await this.addStubs(vsc);
    await this.addExtensions(vsc);
    await this.addSettings(vsc);
    await this.addProjectFile(workspace);

    window.showInformationMessage("Project configuration complete!");

    if (shouldRecommendExtensions()) {
      commands.executeCommand(
        "workbench.extensions.action.showRecommendedExtensions"
      );
    }
  }

  /**
   * Add stubs to the VS Code user folder
   *
   * @param vsc The path to the vscode config folder in current workspace
   */
  private async addStubs(vsc: string) {
    const stubsPath = path.join(vsc, "Pico-W-Stub");
    if (!(await pathExists(stubsPath))) {
      const configFolder = getVsCodeUserPath();
      await symlink(
        path.resolve(path.join(configFolder, "Pico-W-Stub")),
        stubsPath,
        "junction"
      );
    }
  }

  private async addExtensions(vsc: string): Promise<void> {
    const extensionsFilePath = path.join(vsc, "extensions.json");

    // Option for adding recommended extensions in a included extensions.json file
    let extensions = (await readJsonFile(extensionsFilePath)) || {};
    extensions.recommendations = _.union(
      extensions.recommendations || [],
      recommendedExtensions
    );
    await writeJsonFile(extensionsFilePath, extensions);
  }

  private async addSettings(vsc: string): Promise<void> {
    const settingsFilePath = path.join(vsc, "settings.json");
    const stubsPath = path.join(".vscode", "Pico-W-Stub");
    const defaultSettings = {
      "python.linting.enabled": true,
      "python.languageServer": "Pylance",
      "python.analysis.typeCheckingMode": "basic",
      "picowgo.syncFolder": "",
      "picowgo.openOnStart": true,
    };

    let settings = (await readJsonFile(settingsFilePath)) || {};
    settings = _.defaults(settings, defaultSettings);

    settings["python.analysis.typeshedPaths"] = _.union(
      settings["python.analysis.typeshedPaths"] || [],
      [stubsPath]
    );
    settings["python.analysis.extraPaths"] = _.union(
      settings["python.analysis.extraPaths"] || [],
      [path.join(stubsPath, "stubs")]
    );

    await writeJsonFile(settingsFilePath, settings);
  }

  private async addProjectFile(workspace: string): Promise<void> {
    const localProjectFile = path.join(workspace, ".picowgo");

    if (!(await pathExists(localProjectFile))) {
      await writeJsonFile(localProjectFile, {
        info: "This file is just used to identify a project folder.",
      });
    }
  }
}

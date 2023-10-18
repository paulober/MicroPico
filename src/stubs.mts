import { commands, window } from "vscode";
import { join, resolve } from "path";
import {
  getProjectPath,
  getVsCodeUserPath,
  recommendedExtensions,
  shouldRecommendExtensions,
} from "./api.mjs";
import { mkdir, readdir, symlink } from "fs/promises";
import { pathExists, readJsonFile, writeJsonFile } from "./osHelper.mjs";
import { copy, emptyDir } from "fs-extra";
import Logger from "./logger.mjs";
import _ from "lodash";

export default class Stubs {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("Stubs");
  }

  private async updateSettings(): Promise<void> {
    const workspace = getProjectPath();

    if (workspace === undefined) {
      return;
    }

    // the path to the .vscode folder in the project folder
    const vsc = join(workspace, ".vscode");

    // check if .vscode folder exists if not create it
    if (!(await pathExists(vsc))) {
      await mkdir(vsc);
    }

    // update to new vscode settings for new stubs if old stubs are still installed
    // TODO: maybe remove in later versions
    await this.addSettings(vsc, true);
  }

  public async update(): Promise<void> {
    const configFolder = getVsCodeUserPath();
    const installedStubsFolder = join(configFolder, "Pico-W-Stub");

    // TODO: remove in later versions
    await this.updateSettings();

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

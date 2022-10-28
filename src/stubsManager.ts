import { promises as fsp } from 'fs';
import { emptyDir, copy } from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as vscode from 'vscode';
import ApiWrapper from './apiWrapper';
import Utils from './utils';

export default class StubsManager {
  public async updateStubs() {
    let configFolder = Utils.getConfigPath();

    if (!(await Utils.exists(configFolder))) {
      await fsp.mkdir(configFolder, { recursive: true });
    }

    let existingVersionFile = path.join(
      configFolder,
      'Pico-W-Stub',
      'version.json'
    );
    let thisVersionFile = path.resolve(
      // TODO: maybe do path.join(__dirname, '..', '..', 'stubs', 'version.json') for release
      path.join(__dirname, '..', 'stubs', 'version.json')
    );
    let thisVersion = JSON.parse(await fsp.readFile(thisVersionFile, 'utf-8'));

    if (await Utils.exists(existingVersionFile)) {
      let existingVersion = JSON.parse(
        await fsp.readFile(existingVersionFile, 'utf-8')
      );

      if (thisVersion.version === existingVersion.version) {
        return;
      }
    }

    try {
      await emptyDir(path.join(configFolder, 'Pico-W-Stub'));
      await copy(
        // TODO: maybe do for production: path.resolve(path.join(__dirname, '..', '..', 'stubs')),
        path.resolve(path.join(__dirname, '..', 'stubs')),
        path.resolve(path.join(configFolder, 'Pico-W-Stub'))
      );
    } catch (err) {
      console.error(err);
    }
  }

  public async addToWorkspace() {
    // let settings = new SettingsWrapper();
    let api = new ApiWrapper();
    let workspace = api.getProjectPath();

    // no folfer opened in vscode
    if (!workspace) {
      vscode.window.showErrorMessage(
        'You need to open your project folder in VS Code before you can configure it!'
      );
      return;
    }

    // the path to the .vscode folder in the project folder
    let vsc = path.join(workspace, '.vscode');

    // check if .vscode folder exists if not create it
    if (!(await Utils.exists(vsc))) {
      await fsp.mkdir(vsc);
    }

    await this.addStubs(vsc);
    await this.addExtensions(vsc);
    await this.addSettings(vsc);
    await this.addLocalProjectFile(vsc);

    vscode.window.showInformationMessage('Project configuration complete!');

    if (this.shouldShowRecommendedExtensions()) {
      vscode.commands.executeCommand(
        'workbench.extensions.action.showRecommendedExtensions'
      );
    }
  }

  // link stubs to .vscode/Pico-W-Stub
  private async addStubs(vsc: string) {
    if (!(await Utils.exists(path.join(vsc, 'Pico-W-Stub')))) {
      let configFolder = Utils.getConfigPath();

      await fsp.symlink(
        path.resolve(path.join(configFolder, 'Pico-W-Stub')),
        path.join(vsc, 'Pico-W-Stub'),
        'junction'
      );
    }
  }

  // .vscode/extensions.json setup
  private async addExtensions(vsc: string): Promise<void> {
    let extensions: { [key: string]: any } | undefined = {};

    // get recommended extensions from .vscode/extensions.json
    if (await Utils.exists(path.join(vsc, 'extensions.json'))) {
      extensions = JSON.parse(
        await fsp.readFile(path.join(vsc, 'extensions.json'), 'utf-8')
      );
    }

    // check if json parsed successfully if not create it to avoid crashes
    if (extensions?.recommendations === undefined) {
      if (extensions === undefined) {
        extensions = {};
      }
      extensions.recommendations = [];
    }

    // add recommended extensions
    if (!_.includes(extensions.recommendations, 'ms-python.python')) {
      extensions.recommendations.push('ms-python.python');
    }

    if (
      !_.includes(
        extensions.recommendations,
        'visualstudioexptteam.vscodeintellicode'
      )
    ) {
      extensions.recommendations.push('visualstudioexptteam.vscodeintellicode');
    }

    if (!_.includes(extensions.recommendations, 'ms-python.vscode-pylance')) {
      extensions.recommendations.push('ms-python.vscode-pylance');
    }

    // write extensions.json to drive
    await fsp.writeFile(
      path.join(vsc, 'extensions.json'),
      JSON.stringify(extensions, null, 4)
    );
  }

  // .vscode/settings.json setup
  private async addSettings(vsc: string): Promise<void> {
    let settings: { [key: string]: any } | undefined = {};

    if (await Utils.exists(path.join(vsc, 'settings.json'))) {
      settings = JSON.parse(
        await fsp.readFile(path.join(vsc, 'settings.json'), 'utf-8')
      );
    }

    if (settings === undefined) {
      settings = {};
    }

    // add settings
    settings['python.linting.enabled'] = true;

    if (settings['python.analysis.typeshedPaths'] === undefined) {
      settings['python.analysis.typeshedPaths'] = [];
    }

    if (
      !_.includes(
        settings['python.analysis.typeshedPaths'],
        path.join('.vscode', 'Pico-W-Stub')
      )
    ) {
      settings['python.analysis.typeshedPaths'].push(
        path.join('.vscode', 'Pico-W-Stub')
      );
    }

    settings['python.languageServer'] = 'Pylance';
    settings['python.analysis.typeCheckingMode'] = 'basic';

    if (settings['python.analysis.extraPaths'] === undefined) {
      settings['python.analysis.extraPaths'] = [];
    }

    if (
      !_.includes(
        settings['python.analysis.extraPaths'],
        path.join('.vscode', 'Pico-W-Stub', 'stubs')
      )
    ) {
      settings['python.analysis.extraPaths'].push(
        path.join('.vscode', 'Pico-W-Stub', 'stubs')
      );
    }

    // add default picowgo settings
    if (settings['picowgo.syncFolder'] === undefined) {
      settings['picowgo.syncFolder'] = '';
    }
    if (settings['picowgo.openOnStart'] === undefined) {
      settings['picowgo.openOnStart'] = true;
    }

    // (re-)write settings.json to drive
    await fsp.writeFile(
      path.join(vsc, 'settings.json'),
      JSON.stringify(settings, null, 4)
    );
  }

  private async addLocalProjectFile(vsc: string): Promise<void> {
    let api = new ApiWrapper();
    let workspace = api.getProjectPath();

    if (!workspace) {
      vscode.window.showErrorMessage(
        'You need to open your project folder in VS Code before you can configure it!'
      );
      return;
    }

    let localProjectFile = path.join(workspace, '.picowgo');

    if (!(await Utils.exists(localProjectFile))) {
      await fsp.writeFile(
        localProjectFile,
        "{'info': 'This file is just used to identify a project folder.'}"
      );
      return;
    }
  }

  // TODO: don't hardcode this
  private shouldShowRecommendedExtensions(): boolean {
    return (
      vscode.extensions.getExtension('ms-python.python') === undefined ||
      vscode.extensions.getExtension(
        'visualstudioexptteam.vscodeintellicode'
      ) === undefined ||
      vscode.extensions.getExtension('ms-python.vscode-pylance') === undefined
    );
  }
}

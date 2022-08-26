'use babel';

import { promises as fsp } from 'fs';
import path from 'path';
import fse from 'fs-extra';
import _ from 'lodash';
import * as vscode from 'vscode';
import Utils from '../helpers/utils.js';
import ApiWrapper from '../main/api-wrapper.js';
import SettingsWrapper from '../main/settings-wrapper.js';

export default class StubsManager {
    async updateStubs() {
        let configFolder = Utils.getConfigPath();

        if (!await Utils.exists(configFolder))
          await fsp.mkdir(configFolder, { recursive: true });

        let existingVersionFile = path.join(configFolder, 'Pico-W-Stub', 'version.json');
        let thisVersionFile = path.resolve(path.join(__dirname, '..', '..', 'stubs', 'version.json'));
        let thisVersion = JSON.parse(await fsp.readFile(thisVersionFile, 'utf-8'));

        if (await Utils.exists(existingVersionFile)) {
            let existingVersion = JSON.parse(await fsp.readFile(existingVersionFile, 'utf-8'));

            if (thisVersion.version == existingVersion.version)
                return;         
        }

        try {
            await fse.emptyDir(path.join(configFolder, 'Pico-W-Stub')); 
            await fse.copy(path.resolve(path.join(__dirname, '..', '..', 'stubs')), path.resolve(path.join(configFolder, 'Pico-W-Stub')));
        }
        catch(err) {
            console.log(err);
        }      
    }

    async addToWorkspace() {
        let settings = new SettingsWrapper();
        let api = new ApiWrapper(settings);
        let workspace = api.getProjectPath();

        if (!workspace) {
            vscode.window.showErrorMessage('You need to open your project folder in VS Code before you can configure it!');
            return;
        }

        let vsc = path.join(workspace, '.vscode');

        if (!await Utils.exists(vsc)) {
            await fsp.mkdir(vsc);
        }

        await this._addStubs(vsc);
        await this._addExtensions(vsc);
        await this._addSettings(vsc);
        await this._addPicoWGoSettings(settings);

        vscode.window.showInformationMessage('Project configuration complete!');

        if (this.showRecommendedExtensions())
            vscode.commands.executeCommand('workbench.extensions.action.showRecommendedExtensions');
    }

    async _addStubs(vsc) {
        if (!await Utils.exists(path.join(vsc, 'Pico-W-Stub'))) {
            let configFolder = Utils.getConfigPath();
            await fsp.symlink(path.resolve(path.join(configFolder, 'Pico-W-Stub')), path.resolve(path.join(vsc, 'Pico-W-Stub')), 'junction');
        }
    }

    async _addExtensions(vsc) {
        let extensions = {};

        if (await Utils.exists(path.join(vsc, 'extensions.json'))) {
            extensions = JSON.parse(await fsp.readFile(path.join(vsc, 'extensions.json')));
        }

        if (extensions.recommendations === undefined) {
            extensions.recommendations = [];
        }

        if (!_.includes(extensions.recommendations, 'ms-python.python'))
            extensions.recommendations.push('ms-python.python');

        if (!_.includes(extensions.recommendations, 'visualstudioexptteam.vscodeintellicode'))
            extensions.recommendations.push('visualstudioexptteam.vscodeintellicode');

        if (!_.includes(extensions.recommendations, 'ms-python.vscode-pylance'))
            extensions.recommendations.push('ms-python.vscode-pylance');

        await fsp.writeFile(path.join(vsc, 'extensions.json'), JSON.stringify(extensions, null, 4));
    }

    async _addSettings(vsc) {
        let settings = {};

        if (await Utils.exists(path.join(vsc, 'settings.json'))) {
            settings = JSON.parse(await fsp.readFile(path.join(vsc, 'settings.json')));
        }

        settings['python.linting.enabled'] = true;

        if (settings['python.analysis.typeshedPaths'] === undefined) {
            settings['python.analysis.typeshedPaths'] = [];
        }

        if (!_.includes(settings['python.analysis.typeshedPaths'], path.join('.vscode', 'Pico-W-Stub')))
            settings['python.analysis.typeshedPaths'].push(path.join('.vscode', 'Pico-W-Stub'));

        settings['python.languageServer'] = 'Pylance';
        settings['python.analysis.typeCheckingMode'] = 'basic';

        if (settings['python.analysis.extraPaths'] === undefined) {
            settings['python.analysis.extraPaths'] = [];
        }

        if (!_.includes(settings['python.analysis.extraPaths'], path.join('.vscode', 'Pico-W-Stub', 'stubs')))
            settings['python.analysis.extraPaths'].push(path.join('.vscode', 'Pico-W-Stub', 'stubs'));

        await fsp.writeFile(path.join(vsc, 'settings.json'), JSON.stringify(settings, null, 4));
    }

    async _addPicoWGoSettings(settings) {
        await settings.createProjectSettings();
    }

    showRecommendedExtensions() {
        if (
            vscode.extensions.getExtension('ms-python.python') == undefined ||
            vscode.extensions.getExtension('visualstudioexptteam.vscodeintellicode') == undefined ||
            vscode.extensions.getExtension('ms-python.vscode-pylance') == undefined
        ){
            return true;
        }

        return false;
    }
}
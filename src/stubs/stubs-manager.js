"use babel";

const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");
const _ = require("lodash");
const vscode = require("vscode");

import Utils from "../helpers/utils.js";
import ApiWrapper from "../main/api-wrapper.js";

export default class StubsManager {
    updateStubs() {
        let configFolder = Utils.getConfigPath();
        let existingVersionFile = path.join(configFolder, "Pico-Stub", "version.json");

        let thisVersionFile = path.resolve(path.join(__dirname, "..", "..", "stubs", "version.json"));
        let thisVersion = JSON.parse(fs.readFileSync(thisVersionFile, "utf-8"));

        if (fs.existsSync(existingVersionFile)) {
            let existingVersion = JSON.parse(fs.readFileSync(existingVersionFile, "utf-8"));

            if (thisVersion.version == existingVersion.version)
                return;         
        }

        try {
            fse.emptyDirSync(path.join(configFolder, "Pico-Stub")); 
            fse.copySync(path.resolve(path.join(__dirname, "..", "..", "stubs")), path.resolve(path.join(configFolder, "Pico-Stub")));
        }
        catch(err) {
            console.log(err);
        }      
    }

    addToWorkspace() {
        let api = new ApiWrapper();
        let workspace = api.getProjectPath();
        let vsc = path.join(workspace, ".vscode");

        if (!fs.existsSync(vsc)) {
            fs.mkdirSync(vsc);
        }

        this._addStubs(vsc);
        this._addExtensions(vsc);
        this._addSettings(vsc);

        vscode.window.showInformationMessage("Project configuration complete!");
    }

    _addStubs(vsc) {
        if (!fs.existsSync(path.join(vsc, "Pico-Stub"))) {
            let configFolder = Utils.getConfigPath();
            fs.symlinkSync(path.resolve(path.join(configFolder, "Pico-Stub")), path.resolve(path.join(vsc, "Pico-Stub")), "junction");
        }
    }

    _addExtensions(vsc) {
        let extensions = {};

        if (fs.existsSync(path.join(vsc, "extensions.json"))) {
            extensions = JSON.parse(fs.readFileSync(path.join(vsc, "extensions.json")));
        }

        if (extensions.recommendations === undefined) {
            extensions.recommendations = [];
        }

        if (!_.includes(extensions.recommendations, "ms-python.python"))
            extensions.recommendations.push("ms-python.python");

        if (!_.includes(extensions.recommendations, "visualstudioexptteam.vscodeintellicode"))
            extensions.recommendations.push("visualstudioexptteam.vscodeintellicode");

        if (!_.includes(extensions.recommendations, "ms-python.vscode-pylance"))
            extensions.recommendations.push("ms-python.vscode-pylance");

        fs.writeFileSync(path.join(vsc, "extensions.json"), JSON.stringify(extensions, null, 4));
    }

    _addSettings(vsc) {
        let settings = {};

        if (fs.existsSync(path.join(vsc, "settings.json"))) {
            settings = JSON.parse(fs.readFileSync(path.join(vsc, "settings.json")));
        }

        settings["python.linting.enabled"] = true;

        if (settings["python.analysis.typeshedPaths"] === undefined) {
            settings["python.analysis.typeshedPaths"] = [];
        }

        if (!_.includes(settings["python.analysis.typeshedPaths"], path.join(".vscode", "Pico-Stub")))
            settings["python.analysis.typeshedPaths"].push(path.join(".vscode", "Pico-Stub"));

        settings["python.languageServer"] = "Pylance";
        settings["python.analysis.typeCheckingMode"] = "basic";

        if (settings["python.analysis.extraPaths"] === undefined) {
            settings["python.analysis.extraPaths"] = [];
        }

        if (!_.includes(settings["python.analysis.extraPaths"], path.join(".vscode", "Pico-Stub", "stubs")))
            settings["python.analysis.extraPaths"].push(path.join(".vscode", "Pico-Stub", "stubs"));

        fs.writeFileSync(path.join(vsc, "settings.json"), JSON.stringify(settings, null, 4));
    }
}
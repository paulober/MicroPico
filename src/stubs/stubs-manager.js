"use babel";

const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");
const _ = require("lodash");
import Utils from "../helpers/utils.js";
import ApiWrapper from '../main/api-wrapper.js';

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
        this._addPylintRc(workspace);
        this._addExtensions(vsc);
        this._addSettings(vsc);
    }

    _addStubs(vsc) {
        if (!fs.existsSync(path.join(vsc, "Pico-Stub"))) {
            let configFolder = Utils.getConfigPath();
            fs.symlinkSync(path.resolve(path.join(configFolder, "Pico-Stub")), path.resolve(path.join(vsc, "Pico-Stub")), "dir");
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

        if (!_.includes(extensions.recommendations, "VisualStudioExptTeam.vscodeintellicode"))
            extensions.recommendations.push("VisualStudioExptTeam.vscodeintellicode");

        fs.writeFileSync(path.join(vsc, "extensions.json"), JSON.stringify(extensions, null, 4));
    }

    _addSettings(vsc) {
        let settings = {};

        if (fs.existsSync(path.join(vsc, "settings.json"))) {
            settings = JSON.parse(fs.readFileSync(path.join(vsc, "settings.json")));
        }

        settings["python.linting.enabled"] = true;

        if (settings["python.autoComplete.extraPaths"] === undefined) {
            settings["python.autoComplete.extraPaths"] = [];
        }

        if (!_.includes(settings["python.autoComplete.extraPaths"], path.join(".vscode", "Pico-Stub", "frozen")))
            settings["python.autoComplete.extraPaths"].push(path.join(".vscode", "Pico-Stub", "frozen"));

        if (!_.includes(settings["python.autoComplete.extraPaths"], path.join(".vscode", "Pico-Stub", "stubs")))
            settings["python.autoComplete.extraPaths"].push(path.join(".vscode", "Pico-Stub", "stubs"));

        settings["python.autoComplete.typeshedPaths"] = settings["python.autoComplete.extraPaths"];
        settings["python.analysis.typeshedPaths"] = settings["python.autoComplete.extraPaths"];
        settings["python.linting.pylintEnabled"] = true;
        settings["python.languageServer"] = "Microsoft";

        if (settings["python.linting.ignorePatterns"] === undefined) {
            settings["python.linting.ignorePatterns"] = [];
        }

        if (!_.includes(settings["python.linting.ignorePatterns"], path.join(".vscode", "*.py")))
            settings["python.linting.ignorePatterns"].push(path.join(".vscode", "*.py"));

        if (!_.includes(settings["python.linting.ignorePatterns"], path.join("**", "*_asm.py")))
            settings["python.linting.ignorePatterns"].push(path.join("**", "*_asm.py"));

        fs.writeFileSync(path.join(vsc, "settings.json"), JSON.stringify(settings, null, 4));
    }

    _addPylintRc(workspace) {
        let file = path.join(workspace, ".pylintrc");

        if (fs.existsSync(file))
            return;
        
        let content = fs.readFileSync(path.join(__dirname, "..", "..", "src", "stubs", ".pylintrc"), "utf8");
        content = content.replace("{{STUBS}}", "\".vscode/Pico-Stub/frozen\", \".vscode/Pico-Stub/stubs\"");

        fs.writeFileSync(file, content);
    }
}
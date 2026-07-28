import * as vscode from "vscode";
import { existsSync } from "fs";
import { join } from "path";
import { commandPrefix, openSettings } from "../api.mjs";
import { isValidFolderName } from "../utils/folderName.mjs";
import { unknownErrorToString } from "../errorHelper.mjs";
import type { PythonExtension } from "@vscode/python-extension";
import type UI from "../ui.mjs";
import type Stubs from "../stubs.mjs";

/**
 * Dependencies required by the project/settings "leaf" commands.
 *
 * Kept intentionally minimal and explicit - these commands create/initialise
 * projects and open settings; they do not touch the vREPL terminal or the
 * command-executing flag.
 */
export interface ProjectCommandDeps {
  ui?: UI;
  stubs?: Stubs;
  pythonApi: PythonExtension;
  workspaceFolder?: readonly vscode.WorkspaceFolder[];
}

/**
 * Registers the project/settings commands (initialise, new project, global and
 * workspace settings) and pushes each disposable onto the extension's
 * subscriptions.
 *
 * @param context The extension context used to register the commands.
 * @param deps The minimal set of dependencies the handlers require.
 */
export function registerProjectCommands(
  context: vscode.ExtensionContext,
  deps: ProjectCommandDeps,
): void {
  // [Command] Initialise
  let disposable = vscode.commands.registerCommand(
    commandPrefix + "initialise",
    async (location?: string | vscode.Uri, pythonExecutable?: string) => {
      // set python executable
      if (pythonExecutable !== undefined && pythonExecutable.length > 0) {
        await deps.pythonApi.environments.updateActiveEnvironmentPath(
          pythonExecutable,
        );
      }

      let isCurrentWorkspace = false;
      if (
        location &&
        location instanceof vscode.Uri &&
        deps.workspaceFolder &&
        deps.workspaceFolder.length > 0
      ) {
        const folder = deps.workspaceFolder[0];
        if (folder.uri.fsPath === location.fsPath) {
          isCurrentWorkspace = true;
        }
      }
      const path =
        location instanceof vscode.Uri ? location.fsPath : location;

      await deps.stubs?.addToWorkspace(path);
      if (deps.ui?.isHidden() && (!path || isCurrentWorkspace)) {
        await vscode.commands.executeCommand(commandPrefix + "connect");
        deps.ui?.show();
      }
    },
  );
  context.subscriptions.push(disposable);

  // [Command] Global settings
  disposable = vscode.commands.registerCommand(
    commandPrefix + "globalSettings",
    openSettings,
  );
  context.subscriptions.push(disposable);

  // [Command] Workspace settings
  disposable = vscode.commands.registerCommand(
    commandPrefix + "workspaceSettings",
    () => openSettings(true),
  );
  context.subscriptions.push(disposable);

  // [Command] New project
  disposable = vscode.commands.registerCommand(
    commandPrefix + "newProject",
    async () => {
      const result = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: "Select",
        title: "Select location for new project folder",
      });

      if (result === undefined || result.length === 0) {
        return;
      }

      const folderUri = result[0];
      const folderPath = folderUri.fsPath;

      const projectName = await vscode.window.showInputBox({
        prompt: "Enter the new project name",
        placeHolder: "Project name",
        validateInput: (value: string) => {
          if (value.trim().length === 0) {
            return "Project name cannot be empty.";
          }
          // check for invalid characters in folder names
          // or reserved names
          if (!isValidFolderName(value)) {
            return (
              "Project name contains invalid" +
              " characters or is a reserved name."
            );
          }
          if (existsSync(join(folderPath, value))) {
            return (
              "A folder with this name already" +
              " exists in the selected location."
            );
          }

          return null;
        },
      });

      if (projectName === undefined || projectName.trim().length === 0) {
        return;
      }

      const projectPath = join(folderPath, projectName);

      try {
        // create project folder
        //await mkdir(projectPath);
        await vscode.workspace.fs.createDirectory(
          vscode.Uri.file(projectPath),
        );

        // also create a blink.py in it with a import machine
        const blinkPyCode = `from machine import Pin
from utime import sleep

pin = Pin("LED", Pin.OUT)

print("LED starts flashing...")
while True:
    try:
        pin.toggle()
        sleep(1) # sleep 1sec
    except KeyboardInterrupt:
        break
pin.off()
print("Finished.")\r\n`;
        const filePath = join(projectPath, "blink.py");
        await vscode.workspace.fs.writeFile(
          vscode.Uri.file(filePath),
          new TextEncoder().encode(blinkPyCode),
        );

        await vscode.commands.executeCommand(
          commandPrefix + "initialise",
          vscode.Uri.file(projectPath),
        );

        // wait 2 seconds to give user option to read notifications
        await new Promise(resolve => setTimeout(resolve, 2000));

        const forceNewWindow =
          vscode.workspace.workspaceFolders !== undefined &&
          vscode.workspace.workspaceFolders.length > 0;
        // open the folder in current window if no workspace is opened yet
        // else open in new window
        void vscode.commands.executeCommand(
          "vscode.openFolder",
          vscode.Uri.file(projectPath),
          {
            forceNewWindow,
            forceReuseWindow: !forceNewWindow,
          },
        );
      } catch (error) {
        void vscode.window.showErrorMessage(
          `Failed to create project folder: ${unknownErrorToString(error)}`,
        );

        return;
      }
    },
  );
  context.subscriptions.push(disposable);
}

import * as vscode from "vscode";
import { getPythonCommand } from "./osHelper.mjs";
import UI from "./ui.mjs";
import {
  getFocusedFile,
  getSelectedCodeOrLine,
  openSettings,
  writeIntoClipboard,
} from "./api.mjs";
import Stubs from "./stubs.mjs";
import Settings, { SettingsKey } from "./settings.mjs";
import { PyboardRunner, PyOutType } from "@paulober/pyboard-serial-com";
import type {
  PyOut,
  PyOutCommandResult,
  PyOutFsOps,
} from "@paulober/pyboard-serial-com";
import Logger from "./logger.mjs";
import { join } from "path";
import { PicoWFs } from "./filesystem.mjs";

const pkg = vscode.extensions.getExtension("paulober.pico-w-go")?.packageJSON;

export default class Activator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("Activator");
  }

  public async activate(
    context: vscode.ExtensionContext
  ): Promise<UI | undefined> {
    const settings = new Settings(context.workspaceState);
    const pyCommand = settings.pythonExecutable || (await getPythonCommand());
    settings.update(SettingsKey.pythonPath, pyCommand);
    settings.pythonExecutable = pyCommand;

    if (pyCommand === undefined) {
      const choice = await vscode.window.showErrorMessage(
        "Python3 is not installed or not in the system's PATH. Alernatively you can set the pythonPath setting to the path of your Python3 executable in the settings.",
        "Open Settings"
      );

      if (choice === "Open Settings") {
        openSettings();
      }

      return;
    }

    const stubs = new Stubs();
    await stubs.update();

    const comDevice = await settings.getComDevice();

    if (comDevice === undefined) {
      const choice = await vscode.window.showErrorMessage(
        "No COM device found. Please check your connection or ports and try again. Alternatively you can set the manualComDevice setting to the path of your COM device in the settings but make sure to deactivate autoConnect.",
        "Open Settings"
      );

      if (choice === "Open Settings") {
        openSettings();
      }

      return;
    }

    const pyb = new PyboardRunner(
      comDevice,
      this.pyboardOnError,
      this.pyboardOnExit,
      pyCommand
    );

    const ui = new UI(settings);

    context.subscriptions.push({
      dispose: () => {
        pyb.disconnect();
      },
    });

    // [Command] help
    let disposable = vscode.commands.registerCommand(
      "picowgo.help",
      function () {
        vscode.env.openExternal(
          vscode.Uri.parse(
            "https://github.com/paulober/Pico-W-Go/blob/main/README.md"
          )
        );
      }
    );
    context.subscriptions.push(disposable);

    // [Command] List Commands
    disposable = vscode.commands.registerCommand("picowgo.listCommands", () => {
      ui.showQuickPick();
    });
    context.subscriptions.push(disposable);

    // [Command] Initialise
    disposable = vscode.commands.registerCommand("picowgo.initialise", () => {
      stubs.addToWorkspace();
    });
    context.subscriptions.push(disposable);

    // [Command] Connect
    disposable = vscode.commands.registerCommand("picowgo.connect", () => {
      pyb.switchDevice(comDevice);
    });
    context.subscriptions.push(disposable);

    // [Command] Disconnect
    disposable = vscode.commands.registerCommand("picowgo.disconnect", () => {
      pyb.disconnect();
    });
    context.subscriptions.push(disposable);

    // [Command] Run File
    disposable = vscode.commands.registerCommand("picowgo.run", () => {
      if (!pyb.isPipeConnected()) {
        vscode.window.showWarningMessage("Please connect to the Pico first.");
        return;
      }

      const file = getFocusedFile();

      if (file === undefined) {
        vscode.window.showWarningMessage("No file open.");
        return;
      }

      pyb
        .runFile(file, (data: string) => {
          // TODO: print output into terminal and reflect running operation in status bar
        })
        .then((data: PyOut) => {
          if (data.type === PyOutType.commandResult) {
            const result = data as PyOutCommandResult;
            // TODO: reflect result.result in status bar
          }
        });
    });
    context.subscriptions.push(disposable);

    // [Command] Run Selection
    disposable = vscode.commands.registerCommand(
      "picowgo.runselection",
      async () => {
        if (!pyb.isPipeConnected()) {
          vscode.window.showWarningMessage("Please connect to the Pico first.");
          return;
        }

        const code = getSelectedCodeOrLine();

        if (code === undefined) {
          vscode.window.showWarningMessage("No code selected.");
          return;
        } else {
          pyb
            .executeCommand(code, (data: string) => {
              // TODO: print output into terminal and reflect running operation in status bar
            })
            .then((data: PyOut) => {
              if (data.type === PyOutType.commandResult) {
                const result = data as PyOutCommandResult;
                // TODO: reflect result.result in status bar
              }
            });
        }
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Upload project
    disposable = vscode.commands.registerCommand("picowgo.upload", async () => {
      if (!pyb.isPipeConnected()) {
        vscode.window.showWarningMessage("Please connect to the Pico first.");
        return;
      }

      const syncDir = settings.getSyncFolderAbsPath();

      if (syncDir === undefined) {
        vscode.window.showErrorMessage("No open project found!");
        return;
      }

      pyb
        .startUploadingProject(
          syncDir,
          settings.getSyncFileTypes(),
          settings.getIngoredSyncItems(),
          (data: string) => {
            // follow progress
          }
        )
        .then((data: PyOut) => {
          if (data.type === PyOutType.fsOps) {
            const result = data as PyOutFsOps;
            if (result.status) {
              vscode.window.showInformationMessage("Project uploaded.");
            } else {
              vscode.window.showErrorMessage("Project upload failed.");
            }
          }
        });
    });
    context.subscriptions.push(disposable);

    // [Command] Upload file
    disposable = vscode.commands.registerCommand(
      "picowgo.uploadfile",
      async () => {
        if (!pyb.isPipeConnected()) {
          vscode.window.showWarningMessage("Please connect to the Pico first.");
          return;
        }

        const file = getFocusedFile();

        if (file === undefined) {
          vscode.window.showWarningMessage("No file open.");
          return;
        }

        // TODO: maybe upload relative to project root like uploadProject does with files
        pyb
          .uploadFiles([file], "/", undefined, (data: string) => {
            // follow progress
          })
          .then((data: PyOut) => {
            if (data.type === PyOutType.fsOps) {
              const result = data as PyOutFsOps;
              if (result.status) {
                vscode.window.showInformationMessage("File uploaded.");
              } else {
                vscode.window.showErrorMessage("File upload failed.");
              }
            }
          });
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Download project
    // TODO: maybe add diffent warning methods for overwritten files in syncFolder
    disposable = vscode.commands.registerCommand(
      "picowgo.download",
      async () => {
        if (!pyb.isPipeConnected()) {
          vscode.window.showWarningMessage("Please connect to the Pico first.");
          return;
        }

        const syncDir = settings.getSyncFolderAbsPath();

        if (syncDir === undefined) {
          vscode.window.showErrorMessage(
            "No open project with syncFolder as download target found!"
          );
          return;
        }

        pyb
          .downloadProject(syncDir, (data: string) => {
            // follow progress
          })
          .then((data: PyOut) => {
            if (data.type === PyOutType.fsOps) {
              const result = data as PyOutFsOps;
              if (result.status) {
                vscode.window.showInformationMessage("Project downloaded.");
              } else {
                vscode.window.showErrorMessage("Project download failed.");
              }
            }
          });
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Delete all files on Pico
    disposable = vscode.commands.registerCommand(
      "picowgo.deleteAllFiles",
      async () => {
        if (!pyb.isPipeConnected()) {
          vscode.window.showWarningMessage("Please connect to the Pico first.");
          return;
        }

        pyb.deleteFolderRecursive("/").then((data: PyOut) => {
          if (data.type === PyOutType.fsOps) {
            const result = data as PyOutFsOps;
            if (result.status) {
              vscode.window.showInformationMessage(
                "All files on Pico were deleted."
              );
            } else {
              vscode.window.showErrorMessage("File deletion on Pico failed.");
            }
          }
        });
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Global settings
    disposable = vscode.commands.registerCommand(
      "picowgo.globalsettings",
      async () => {
        openSettings();
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Toggle connection
    disposable = vscode.commands.registerCommand(
      "picowgo.toggleConnect",
      async () => {
        if (pyb.isPipeConnected()) {
          pyb.disconnect();
        } else {
          pyb.switchDevice(comDevice);
        }
      }
    );
    context.subscriptions.push(disposable);

    const picowFs = new PicoWFs(pyb);

    context.subscriptions.push(
      vscode.workspace.registerFileSystemProvider("picowfs", picowFs, {
        isCaseSensitive: true,
        isReadonly: false,
      })
    );

    // [Command] Toggle virutal file-system
    disposable = vscode.commands.registerCommand(
      "picowgo.toggleFileSystem",
      async () => {
        const findWorkspace = vscode.workspace.workspaceFolders?.find(
          folder => folder.uri.scheme === "picowfs"
        );
        if (findWorkspace !== undefined) {
          // remove findWorkspace
          vscode.workspace.updateWorkspaceFolders(findWorkspace.index, 1);
          return;
        }

        if (!pyb.isPipeConnected()) {
          vscode.window.showWarningMessage("Please connect to the Pico first.");
          return;
        }

        vscode.workspace.updateWorkspaceFolders(
          vscode.workspace.workspaceFolders
            ? vscode.workspace.workspaceFolders.length
            : 0,
          null,
          {
            uri: vscode.Uri.parse("picowfs:/"),
            name: "Pico (W) Remote Workspace",
          }
        );
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Open pin map
    disposable = vscode.commands.registerCommand(
      "picowgo.extra.pins",
      async () => {
        const panel = vscode.window.createWebviewPanel(
          "pins",
          "Pico W Pin Map",
          vscode.ViewColumn.Active,
          {
            enableScripts: false,
            // Only allow the webview to access resources in our extension's media directory
            localResourceRoots: [
              vscode.Uri.file(join(context.extensionPath, "images")),
            ],
          }
        );

        const onDiskPath = vscode.Uri.file(
          join(context.extensionPath, "images", "Pico-W-Pins.svg")
        );
        const imageUrl = panel.webview.asWebviewUri(onDiskPath);

        panel.webview.html = this.getPinMapHtml(imageUrl.toString());
      }
    );
    context.subscriptions.push(disposable);

    // [Command] List all serial ports a Pico is connected to
    disposable = vscode.commands.registerCommand(
      "picowgo.extra.getSerial",
      async () => {
        const ports = await PyboardRunner.getPorts();
        if (ports.ports.length > 1) {
          // TODO: maybe replace with quick pick in the future
          vscode.window.showInformationMessage(
            "Found: " + ports.ports.join(", ")
          );
        } else if (ports.ports.length === 1) {
          writeIntoClipboard(ports.ports[0]);
          vscode.window.showInformationMessage(
            `Found: ${ports.ports[0]} (copied to clipboard).`
          );
        } else {
          vscode.window.showWarningMessage("No connected Pico found.");
        }
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Soft reset pico
    disposable = vscode.commands.registerCommand(
      "picowgo.extra.soft",
      async () => {
        if (!pyb.isPipeConnected()) {
          vscode.window.showWarningMessage("Please connect to the Pico first.");
          return;
        }

        const result = await pyb.softReset();
        if (result.type === PyOutType.commandResult) {
          const fsOps = result as PyOutCommandResult;
          if (fsOps.result) {
            vscode.window.showInformationMessage("Soft reset done");
          } else {
            vscode.window.showErrorMessage("Soft reset failed");
          }
        }
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Hard reset pico
    disposable = vscode.commands.registerCommand(
      "picowgo.extra.hard",
      async () => {
        if (!pyb.isPipeConnected()) {
          vscode.window.showWarningMessage("Please connect to the Pico first.");
          return;
        }

        const result = await pyb.hardReset();
        if (result.type === PyOutType.commandResult) {
          const fsOps = result as PyOutCommandResult;
          if (fsOps.result) {
            vscode.window.showInformationMessage("Hard reset done");
          } else {
            vscode.window.showErrorMessage("Hard reset failed");
          }
        }
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Stop all running stuff on Pico
    disposable = vscode.commands.registerCommand(
      "picowgo.universalStop",
      async () => {
        // TODO: send Ctrl+C X 2 to Pico thought stdin if currently friendly command, selection or file is running
        vscode.window.showWarningMessage("Currently not available.");
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Check for firmware updates
    disposable = vscode.commands.registerCommand(
      "picowgo.extra.firmware",
      async () => {
        vscode.env.openExternal(
          vscode.Uri.parse("https://micropython.org/download/")
        );
      }
    );
    context.subscriptions.push(disposable);

    return ui;
  }

  private pyboardOnError(data: Buffer | undefined) {
    if (data === undefined) {
      this.logger.info("Connection to Pico successfully established");
      return;
    } else {
      vscode.window.showErrorMessage(data.toString("utf-8"));
    }
  }

  private pyboardOnExit(code: number | null) {
    vscode.window.showErrorMessage(`Pyboard exited with code ${code}`);
  }

  private getPinMapHtml(imageUrl: string) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pico W Pin Map</title>
        <style type="text/css">
            body {
                background-color: #191c2b;
            }
        </style>
    </head>
    <body>
        <img src="${imageUrl}" />
        <p style="color: #fff; font-size: 12px; margin-top: 10px;">Image from <a href="https://www.raspberrypi.org/documentation/rp2040/getting-started/" style="color: #fff; text-decoration: none;">© 2023 Copytight Raspberry Pi Foundation</a></p>
    </body>
    </html>`;
  }
}

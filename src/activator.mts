import * as vscode from "vscode";
import { getPythonCommand, installPyserial } from "./osHelper.mjs";
import UI from "./ui.mjs";
import {
  TERMINAL_NAME,
  focusTerminal,
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
  PyOutCommandWithResponse,
  PyOutStatus,
  PyOutTabComp,
} from "@paulober/pyboard-serial-com";
import Logger from "./logger.mjs";
import { basename, dirname, join } from "path";
import { PicoWFs } from "./filesystem.mjs";
import { Terminal } from "./terminal.mjs";
import { fileURLToPath } from "url";

/*const pkg: {} | undefined = vscode.extensions.getExtension("paulober.pico-w-go")
  ?.packageJSON as object;*/
const PICO_VARIANTS = ["Pico (H)", "Pico W(H)"];
const PICO_VARAINTS_PINOUTS = ["pico-pinout.svg", "picow-pinout.svg"];

export default class Activator {
  private logger: Logger;
  private pyb?: PyboardRunner;
  private ui?: UI;
  private stubs?: Stubs;
  private picoFs?: PicoWFs;

  private autoConnectTimer?: NodeJS.Timer;
  private comDevice?: string;

  constructor() {
    this.logger = new Logger("Activator");
  }

  public async activate(
    context: vscode.ExtensionContext
  ): Promise<UI | undefined> {
    const settings = new Settings(context.workspaceState);
    const pyCommand = settings.pythonExecutable ?? (await getPythonCommand());
    await settings.update(SettingsKey.pythonPath, pyCommand);
    settings.pythonExecutable = pyCommand;

    if (pyCommand === undefined) {
      const choice = await vscode.window.showErrorMessage(
        "Python3 is not installed or not in the system's PATH. Alernatively " +
          "you can set the pythonPath setting to the path of your " +
          "Python3 executable in the settings.",
        "Open Settings"
      );

      if (choice === "Open Settings") {
        openSettings();
      }

      return;
    }

    const isInstalled = await installPyserial(pyCommand);

    if (!isInstalled) {
      this.logger.error("Failed to install pyserial pip package.");
      void vscode.window.showErrorMessage(
        "Failed to install pyserial pip package. Check that your " +
          "python path in the settings (`picowgo.pythonPath`) is " +
          "pointing to the correct python executable."
      );
      throw new Error(
        "[Pico-W-Go] Faild to install pyserial pip package. " +
          "Manual install required!"
      );
    }

    this.stubs = new Stubs();
    await this.stubs.update();

    this.comDevice = await settings.getComDevice();

    if (this.comDevice === undefined || this.comDevice === "") {
      this.comDevice = undefined;

      void vscode.window
        .showErrorMessage(
          "No COM device found. Please check your connection or ports and " +
            "try again. Alternatively you can set the manualComDevice " +
            "setting to the path of your COM device in the settings but " +
            "make sure to deactivate autoConnect. For Linux users: make " +
            "sure your user is in dialout group: " +
            "sudo usermod -a -G dialout $USER",
          "Open Settings"
        )
        .then((choice: "Open Settings" | undefined) => {
          if (choice === "Open Settings") {
            openSettings();
          }
        });
    }

    this.ui = new UI(settings);
    this.ui.init();

    this.pyb = new PyboardRunner(
      this.comDevice ?? "default",
      this.pyboardOnError.bind(this),
      this.pyboardOnExit.bind(this),
      pyCommand
    );

    this.setupAutoConnect(settings);

    const terminal = new Terminal(async () => {
      if (this.pyb?.isPipeConnected()) {
        const result = await this.pyb?.executeCommand(
          "\rfrom usys import implementation, version; " +
            "print(version.split('; ')[1] + '; ' + implementation._machine)"
        );
        if (result.type === PyOutType.commandWithResponse) {
          return (
            "\x1b[1;32m" +
            (result as PyOutCommandWithResponse).response +
            "\x1b[0m" +
            'Type "help()" for more information or ' +
            ".cls/.clear to clear the terminal." +
            "\r\n".repeat(2)
          );
        }
      }

      return "No connection to Pico (W) REPL";
    });
    let commandExecuting = false;
    terminal.onDidSubmit(async (cmd: string) => {
      if (commandExecuting) {
        await this.pyb?.writeToPyboard(cmd);

        return;
      }

      commandExecuting = true;
      await this.pyb?.executeFriendlyCommand(cmd, (data: string) => {
        if (data === "!!JSONDecodeError!!" || data === "!!ERR!!") {
          // write red text into terminal
          terminal?.write("\x1b[31mException occured\x1b[0m");

          return;
        }
        if (data.length > 0) {
          terminal?.write(data);
        }
      });
      commandExecuting = false;
      terminal?.prompt();
    });
    terminal.onDidRequestTabComp(async (buf: string) => {
      terminal.freeze();
      const nlIdx = buf.lastIndexOf("\n");
      const lastLineTrimmed = buf.slice(nlIdx + 1).trim();
      const result = await this.pyb?.retrieveTabCompletion(lastLineTrimmed);
      // to be modified if simple tab completion
      let newUserInp = buf;
      if (
        result?.type === PyOutType.tabComp &&
        (result as PyOutTabComp).completion.length > 0
      ) {
        const compResult = result as PyOutTabComp;
        if (compResult.isSimple) {
          newUserInp = newUserInp.replace(
            lastLineTrimmed,
            compResult.completion
          );
        } else {
          terminal.write(compResult.completion);
        }
      }
      terminal.prompt();
      terminal.melt();

      // simulate user input to get the correct indentation
      for (const char of newUserInp) {
        terminal.handleInput(char);
      }
    });

    try {
      // dispose old terminals on reactivation as otherwise they would be frozen
      vscode.window.terminals
        .find(term => term.creationOptions.name === TERMINAL_NAME)
        ?.dispose();
    } catch {
      console.warn("Failed to dispose old terminals on reactivation.");
    }

    const terminalOptions = {
      name: TERMINAL_NAME,
      iconPath: vscode.Uri.file(
        join(
          dirname(fileURLToPath(import.meta.url)),
          "..",
          "images",
          "logo-256.png"
        )
      ),
      isTransient: true,
      pty: terminal,
      hideFromUser: false,
      location: vscode.TerminalLocation.Panel,
    };

    // register terminal profile provider
    context.subscriptions.push(
      vscode.window.registerTerminalProfileProvider("picowgo.vrepl", {
        provideTerminalProfile: () =>
          new vscode.TerminalProfile(terminalOptions),
      })
    );

    context.subscriptions.push(
      vscode.window.onDidOpenTerminal(newTerminal => {
        if (newTerminal.creationOptions.name === TERMINAL_NAME) {
          if (terminal?.getIsOpen()) {
            void vscode.window.showWarningMessage(
              "Only one instance of Pico (W) vREPL is recommended. " +
                "Please close the new terminal instance!"
            );
            // would freeze old terminal
            //newTerminal.dispose();

            // TODO: currently disreagarding if user has unsubmitted input in pty
            // send enter for new prompt
            newTerminal.sendText("\n");
          }
        }
      })
    );

    context.subscriptions.push(
      vscode.window.onDidCloseTerminal(closedTerminal => {
        if (closedTerminal.creationOptions.name === TERMINAL_NAME) {
          // close all other vREPL instance as they freeze anyway because the
          // close operation does dispose the pty in the background
          vscode.window.terminals
            .filter(t => t.creationOptions.name === TERMINAL_NAME)
            .forEach(t => t.dispose());
        }
      })
    );

    // register fs provider as early as possible
    this.picoFs = new PicoWFs(this.pyb);
    context.subscriptions.push(
      vscode.workspace.registerFileSystemProvider("pico", this.picoFs, {
        isCaseSensitive: true,
        isReadonly: false,
      })
    );

    context.subscriptions.push({
      dispose: async () => {
        await this.pyb?.disconnect();
      },
    });

    if (
      settings.getBoolean(SettingsKey.openOnStart) &&
      this.comDevice !== undefined
    ) {
      await focusTerminal(terminalOptions);
    }

    // [Command] help
    let disposable = vscode.commands.registerCommand(
      "picowgo.help",
      function () {
        void vscode.env.openExternal(
          vscode.Uri.parse(
            "https://github.com/paulober/Pico-W-Go/blob/main/README.md"
          )
        );
      }
    );
    context.subscriptions.push(disposable);

    // [Command] List Commands
    disposable = vscode.commands.registerCommand("picowgo.listCommands", () => {
      this.ui?.showQuickPick();
    });
    context.subscriptions.push(disposable);

    // [Command] Initialise
    disposable = vscode.commands.registerCommand(
      "picowgo.initialise",
      async () => {
        await this.stubs?.addToWorkspace();
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Connect
    disposable = vscode.commands.registerCommand(
      "picowgo.connect",
      async () => {
        this.comDevice = await settings.getComDevice();
        if (this.comDevice !== undefined) {
          this.ui?.init();
          this.pyb?.switchDevice(this.comDevice);
          this.setupAutoConnect(settings);
        }
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Disconnect
    disposable = vscode.commands.registerCommand(
      "picowgo.disconnect",
      async () => {
        clearInterval(this.autoConnectTimer);
        await this.pyb?.disconnect();
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Run File
    disposable = vscode.commands.registerCommand("picowgo.run", async () => {
      if (!this.pyb?.isPipeConnected()) {
        void vscode.window.showWarningMessage(
          "Please connect to the Pico first."
        );

        return;
      }

      let file = await getFocusedFile();

      if (file === undefined) {
        file = await getFocusedFile(true);
        if (file === undefined) {
          void vscode.window.showWarningMessage("No file open and focused.");

          return;
        } else {
          void vscode.commands.executeCommand("picowgo.remote.run");

          return;
        }
      }

      let frozen = false;
      await focusTerminal(terminalOptions);
      const data = await this.pyb.runFile(file, (data: string) => {
        // only freeze after operation has started
        if (!frozen) {
          commandExecuting = true;
          terminal?.clean(true);
          terminal?.write("\r\n");
          this.ui?.userOperationStarted();
          frozen = true;
        }
        if (data.includes("!!ERR!!")) {
          // write red text into terminal
          terminal?.write(
            "\x1b[31mException occured (maybe a connection loss)\x1b[0m\r\n"
          );
        } else if (data.length > 0) {
          terminal?.write(data);
        }
      });
      this.ui?.userOperationStopped();
      if (data.type === PyOutType.commandResult) {
        // const result = data as PyOutCommandResult;
        // TODO: reflect result.result somehow
      }
      commandExecuting = false;
      terminal?.melt();
      terminal?.write("\r\n");
      terminal?.prompt();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      "picowgo.remote.run",
      async () => {
        if (!this.pyb?.isPipeConnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        const file = await getFocusedFile(true);

        if (file === undefined) {
          void vscode.window.showWarningMessage(
            "No remote file open and focused."
          );

          return;
        }

        let frozen = false;
        await focusTerminal(terminalOptions);
        await this.pyb.executeCommand(
          "import uos as _pico_uos; " +
            "__pico_dir=_pico_uos.getcwd(); " +
            `_pico_uos.chdir('${dirname(file)}'); ` +
            `execfile('${file}'); ` +
            "_pico_uos.chdir(__pico_dir); " +
            "del __pico_dir; " +
            "del _pico_uos",
          (data: string) => {
            // only freeze after operation has started
            if (!frozen) {
              commandExecuting = true;
              terminal?.clean(true);
              terminal?.write("\r\n");
              this.ui?.userOperationStarted();
              frozen = true;
            }
            if (data.length > 0) {
              terminal?.write(data);
            }
          },
          true
        );
        this.ui?.userOperationStopped();
        commandExecuting = false;
        terminal?.melt();
        terminal?.write("\r\n");
        terminal?.prompt();
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Run Selection
    disposable = vscode.commands.registerCommand(
      "picowgo.runselection",
      async () => {
        if (!this.pyb?.isPipeConnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        const code = getSelectedCodeOrLine();

        if (code === undefined) {
          void vscode.window.showWarningMessage("No code selected.");

          return;
        } else {
          let frozen = false;
          await focusTerminal(terminalOptions);
          const data = await this.pyb.executeCommand(
            code,
            (data: string) => {
              // only freeze after operation has started
              if (!frozen) {
                commandExecuting = true;
                terminal?.clean(true);
                terminal?.write("\r\n");
                this.ui?.userOperationStarted();
                frozen = true;
              }
              if (data.length > 0) {
                terminal?.write(data);
              }
            },
            true
          );
          commandExecuting = false;
          this.ui?.userOperationStopped();
          if (data.type === PyOutType.commandResult) {
            // const result = data as PyOutCommandResult;
            // TODO: reflect result.result in status bar
          }
          terminal?.melt();
          terminal?.prompt();
        }
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Upload project
    disposable = vscode.commands.registerCommand("picowgo.upload", async () => {
      if (!this.pyb?.isPipeConnected()) {
        void vscode.window.showWarningMessage(
          "Please connect to the Pico first."
        );

        return;
      }

      const syncDir = settings.getSyncFolderAbsPath();

      if (syncDir === undefined) {
        void vscode.window.showErrorMessage("No open project found!");

        return;
      }

      if (settings.getBoolean(SettingsKey.gcBeforeUpload)) {
        // TODO: maybe do soft reboot instead of gc for bigger impact
        await this.pyb?.executeCommand(
          "import gc as __pico_gc; __pico_gc.collect(); del __pico_gc"
        );
      }
      void vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Uploading project...",
          cancellable: false,
        },
        async (progress, token) => {
          // cancellation is not possible
          token.onCancellationRequested(() => undefined);

          const data = await this.pyb?.startUploadingProject(
            syncDir,
            settings.getSyncFileTypes(),
            settings.getIngoredSyncItems().concat([".picowgo"]),
            (/*data: string*/) => {
              //progress.report({ message: data });
            }
          );

          // check if data is PyOut
          if (data === undefined) {
            return;
          }

          if (data.type === PyOutType.status) {
            const result = data as PyOutStatus;
            if (result.status) {
              progress.report({ increment: 100, message: "Project uploaded." });
              void vscode.window.showInformationMessage("Project uploaded.");
              if (settings.getBoolean(SettingsKey.softResetAfterUpload)) {
                await this.pyb?.softReset();
              }
            } else {
              void vscode.window.showErrorMessage("Project upload failed.");
            }
          }
        }
      );
    });
    context.subscriptions.push(disposable);

    // [Command] Upload file
    disposable = vscode.commands.registerCommand(
      "picowgo.uploadFile",
      async () => {
        if (!this.pyb?.isPipeConnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        const file = await getFocusedFile();

        if (file === undefined) {
          void vscode.window.showWarningMessage("No file open.");

          return;
        }

        // TODO: maybe upload relative to project root like uploadProject does with files
        let pastProgress = 0;

        if (settings.getBoolean(SettingsKey.gcBeforeUpload)) {
          await this.pyb?.executeCommand(
            "import gc as __pico_gc; __pico_gc.collect(); del __pico_gc"
          );
        }
        void vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Uploading file...",
            cancellable: false,
          },
          async (progress /*, token*/) => {
            const data = await this.pyb?.uploadFiles(
              [file],
              "/",
              undefined,
              (data: string) => {
                const match = data.match(/:\s*(\d+)%/);
                if (match !== null && match.length === 2) {
                  const inc = parseInt(match[1]) - pastProgress;
                  pastProgress += inc;
                  if (pastProgress >= 100) {
                    progress.report({ message: "File uploaded." });
                  } else {
                    progress.report({ increment: inc });
                  }
                }
              }
            );
            if (data && data.type === PyOutType.status) {
              const result = data as PyOutStatus;
              if (result.status) {
                this.picoFs?.fileChanged(
                  vscode.FileChangeType.Created,
                  vscode.Uri.from({
                    scheme: "pico",
                    path: "/" + basename(file),
                  })
                );
                if (settings.getBoolean(SettingsKey.softResetAfterUpload)) {
                  await this.pyb?.softReset();
                }
              } else {
                void vscode.window.showErrorMessage("File upload failed.");
              }
            }
          }
        );
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Download project
    // TODO: maybe add diffent warning methods for overwritten files in syncFolder
    disposable = vscode.commands.registerCommand("picowgo.download", () => {
      if (!this.pyb?.isPipeConnected()) {
        void vscode.window.showWarningMessage(
          "Please connect to the Pico first."
        );

        return;
      }

      const syncDir = settings.getSyncFolderAbsPath();

      if (syncDir === undefined) {
        void vscode.window.showErrorMessage(
          "No open project with syncFolder as download target found!"
        );

        return;
      }

      void vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Downloading Project...",
          cancellable: false,
        },
        async (progress /*, token*/) => {
          const data = await this.pyb?.downloadProject(
            syncDir,
            (/*data: string*/) => undefined
          );
          if (data && data.type === PyOutType.status) {
            const result = data as PyOutStatus;
            if (result.status) {
              progress.report({
                increment: 100,
                message: "Project downloaded.",
              });
              void vscode.window.showInformationMessage("Project downloaded.");
            } else {
              void vscode.window.showErrorMessage("Project download failed.");
            }
          }
        }
      );
    });
    context.subscriptions.push(disposable);

    // [Command] Delete all files on Pico
    disposable = vscode.commands.registerCommand(
      "picowgo.deleteAllFiles",
      () => {
        if (!this.pyb?.isPipeConnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        void this.pyb.deleteFolderRecursive("/").then((data: PyOut) => {
          if (data.type === PyOutType.status) {
            const result = data as PyOutStatus;
            if (result.status) {
              void vscode.window.showInformationMessage(
                "All files on Pico were deleted."
              );
            } else {
              void vscode.window.showErrorMessage(
                "File deletion on Pico failed."
              );
            }
          }
        });
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Global settings
    disposable = vscode.commands.registerCommand(
      "picowgo.globalSettings",
      openSettings
    );
    context.subscriptions.push(disposable);

    // [Command] Workspace settings
    disposable = vscode.commands.registerCommand(
      "picowgo.workspaceSettings",
      () => openSettings(true)
    );
    context.subscriptions.push(disposable);

    // [Command] Toggle connection
    disposable = vscode.commands.registerCommand(
      "picowgo.toggleConnect",
      async () => {
        if (this.pyb?.isPipeConnected()) {
          clearInterval(this.autoConnectTimer);
          await this.pyb?.disconnect();
        } else {
          this.comDevice = await settings.getComDevice();
          if (this.comDevice === undefined) {
            void vscode.window.showErrorMessage("No COM device found!");
          } else {
            this.ui?.init();
            this.pyb?.switchDevice(this.comDevice);
            this.setupAutoConnect(settings);
          }
        }
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Toggle virutal file-system
    disposable = vscode.commands.registerCommand(
      "picowgo.toggleFileSystem",
      () => {
        const findWorkspace = vscode.workspace.workspaceFolders?.find(
          folder => folder.uri.scheme === "pico"
        );
        if (findWorkspace !== undefined) {
          // remove findWorkspace
          vscode.workspace.updateWorkspaceFolders(findWorkspace.index, 1);

          return;
        }

        if (!this.pyb?.isPipeConnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        vscode.workspace.updateWorkspaceFolders(
          vscode.workspace.workspaceFolders
            ? vscode.workspace.workspaceFolders.length
            : 0,
          null,
          {
            uri: vscode.Uri.parse("pico://"),
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
        const picoVariant = await vscode.window.showQuickPick(PICO_VARIANTS, {
          canPickMany: false,
          placeHolder: "Select your Pico variant",
          ignoreFocusOut: false,
        });

        const variantIdx = PICO_VARIANTS.indexOf(picoVariant ?? "");
        if (variantIdx < 0) {
          return;
        }

        const panel = vscode.window.createWebviewPanel(
          "picowgo.pinoout",
          `${PICO_VARIANTS[variantIdx]} Pinout`,
          vscode.ViewColumn.Active,
          {
            enableScripts: false,
            // Only allow the webview to access resources in our extension's media directory
            localResourceRoots: [
              vscode.Uri.file(join(context.extensionPath, "images")),
            ],
          }
        );

        panel.webview.html = this.getPinMapHtml(
          PICO_VARIANTS[variantIdx],
          panel.webview
            .asWebviewUri(
              vscode.Uri.file(
                join(
                  context.extensionPath,
                  "images",
                  PICO_VARAINTS_PINOUTS[variantIdx]
                )
              )
            )
            .toString()
        );
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
          void vscode.window.showInformationMessage(
            "Found: " + ports.ports.join(", ")
          );
        } else if (ports.ports.length === 1) {
          writeIntoClipboard(ports.ports[0]);
          void vscode.window.showInformationMessage(
            `Found: ${ports.ports[0]} (copied to clipboard).`
          );
        } else {
          void vscode.window.showWarningMessage("No connected Pico found.");
        }
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Switch Pico
    disposable = vscode.commands.registerCommand(
      "picowgo.switchPico",
      async () => {
        if (this.pyb?.isPipeConnected()) {
          await this.pyb?.disconnect();
        }

        const ports = await PyboardRunner.getPorts(settings.pythonExecutable);
        if (ports.ports.length === 0) {
          void vscode.window.showErrorMessage("No connected Pico found!");
        }

        const port = await vscode.window.showQuickPick(ports.ports, {
          canPickMany: false,
          placeHolder:
            "Select your the COM port of the Pico you want to connect to",
          ignoreFocusOut: false,
        });

        if (port !== undefined) {
          this.comDevice = port;
          this.pyb?.switchDevice(this.comDevice);
        }
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Soft reset pico
    disposable = vscode.commands.registerCommand(
      "picowgo.reset.soft",
      async () => {
        if (!this.pyb?.isPipeConnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        const result = await this.pyb?.softReset();
        if (result.type === PyOutType.commandResult) {
          const fsOps = result as PyOutCommandResult;
          if (fsOps.result) {
            void vscode.window.showInformationMessage("Soft reset done");

            return;
          }
        }
        void vscode.window.showErrorMessage("Soft reset failed");
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Hard reset pico
    disposable = vscode.commands.registerCommand(
      "picowgo.reset.hard",
      async () => {
        if (!this.pyb?.isPipeConnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        const result = await this.pyb?.hardReset();
        if (result.type === PyOutType.commandResult) {
          const fsOps = result as PyOutCommandResult;
          if (fsOps.result) {
            void vscode.window.showInformationMessage("Hard reset done");
          } else {
            void vscode.window.showErrorMessage("Hard reset failed");
          }
        }
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      "picowgo.universalStop",
      async () => {
        if (
          !this.pyb?.isPipeConnected() ||
          !this.ui?.isUserOperationOngoing()
        ) {
          void vscode.window.showInformationMessage("Nothing to stop.");

          return;
        }

        // double ctrl+c to stop any running program
        await this.pyb?.writeToPyboard("\x03\x03\n");

        // wait for the program to stop
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    );

    // [Command] Check for firmware updates
    disposable = vscode.commands.registerCommand(
      "picowgo.extra.firmwareUpdates",
      () => {
        void vscode.env.openExternal(
          vscode.Uri.parse("https://micropython.org/download/")
        );
      }
    );
    context.subscriptions.push(disposable);

    return this.ui;
  }

  private setupAutoConnect(settings: Settings): void {
    this.autoConnectTimer = setInterval(
      // TODO (important): this should not take longer than 2500ms because
      // then the there would b a hell of a concurrency problem
      () =>
        void (async () => {
          // this could let the PyboardRunner let recognize that it lost connection to
          // the pyboard wrapper and mark the Pico as disconnected
          await this.pyb?.checkStatus();
          if (this.pyb?.isPipeConnected()) {
            this.ui?.refreshState(true);

            return;
          }
          this.ui?.refreshState(false);
          const autoPort = settings.getBoolean(SettingsKey.autoConnect);

          const ports = await PyboardRunner.getPorts(settings.pythonExecutable);
          if (ports.ports.length === 0) {
            return;
          }

          // try to connect to previously connected device first
          if (this.comDevice && ports.ports.includes(this.comDevice)) {
            // try to reconnect
            this.pyb?.switchDevice(this.comDevice);
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (this.pyb?.isPipeConnected()) {
              return;
            }
          }

          if (autoPort) {
            const port = ports.ports[0];
            this.comDevice = port;
            this.pyb?.switchDevice(port);
          }
        })(),
      2500
    );
  }

  private pyboardOnError(data: Buffer | undefined): void {
    if (
      data === undefined &&
      this.comDevice !== undefined &&
      this.comDevice !== "" &&
      this.comDevice !== "default"
    ) {
      //this.ui?.refreshState(true);
      this.logger.info("Connection to wrapper successfully established");

      return;
    } else {
      if (data) {
        void vscode.window.showErrorMessage(data.toString("utf-8"));
      }
    }
  }

  private pyboardOnExit(code: number | null): void {
    this.ui?.refreshState(false);
    if (code === 0 || code === null) {
      this.logger.info(`Pyboard exited with code 0`);
      void vscode.window.showInformationMessage("Disconnected from Pico");
    } else {
      this.logger.error(`Pyboard exited with code ${code}`);
      void vscode.window.showErrorMessage("Connection to Pico lost");
    }
  }

  private getPinMapHtml(variantName: string, imageUrl: string): string {
    return (
      `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>${variantName} Pinout</title>
        <style type="text/css">
            body {
                background-color: transparent;
            }
        </style>
    </head>
    <body>
        <img src="${imageUrl}" alt="${variantName} pinout graphic" />
        <p style="color: #fff; font-size: 12px; margin-top: 10px;">Image from` +
      ' <a href="https://www.raspberrypi.com/documentation/microcontrollers' +
      '/raspberry-pi-pico.html" style="color: #fff; text-decoration: none;">' +
      `© ${new Date().getFullYear()} Copyright Raspberry Pi Foundation</a></p>
    </body>
    </html>`
    );
  }
}

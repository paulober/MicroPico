import * as vscode from "vscode";
import UI from "./ui.mjs";
import {
  TERMINAL_NAME,
  commandPrefix,
  focusTerminal,
  getFocusedFile,
  getSelectedCodeOrLine,
  openSettings,
  writeIntoClipboard,
} from "./api.mjs";
import Stubs, {
  displayStringToStubPort,
  fetchAvailableStubsVersions,
  installIncludedStubs,
  installStubsByPipVersion,
  installStubsByVersion,
  STUB_PORTS,
  stubPortToDisplayString,
  stubsInstalled,
} from "./stubs.mjs";
import Settings, { SettingsKey } from "./settings.mjs";
import Logger from "./logger.mjs";
import { basename, dirname, join } from "path";
import { PicoRemoteFileSystem } from "./filesystem.mjs";
import { Terminal } from "./terminal.mjs";
import { fileURLToPath } from "url";
import { ContextKeys } from "./models/contextKeys.mjs";
import DeviceWifiProvider from "./activitybar/deviceWifiTree.mjs";
import PackagesWebviewProvider from "./activitybar/packagesWebview.mjs";
import {
  OperationResultType,
  PicoMpyCom,
  PicoSerialEvents,
} from "@paulober/pico-mpy-com";
import {
  type ActiveEnvironmentPathChangeEvent,
  PythonExtension,
} from "@vscode/python-extension";
import { flashPicoInteractively } from "./flash.mjs";

/*const pkg: {} | undefined = vscode.extensions.getExtension("paulober.pico-w-go")
  ?.packageJSON as object;*/
const PICO_VARIANTS = ["Pico (H)", "Pico W(H)"];
const PICO_VARAINTS_PINOUTS = ["pico-pinout.svg", "picow-pinout.svg"];

export default class Activator {
  private logger: Logger;
  private ui?: UI;
  private stubs?: Stubs;
  private picoFs?: PicoRemoteFileSystem;
  private terminal?: Terminal;
  private terminalOptions?: vscode.ExtensionTerminalOptions;
  private pythonPath?: string;
  private activationFilePresentAtLaunch = false;
  private settings?: Settings;

  private autoConnectTimer?: NodeJS.Timeout;
  private comDevice?: string;
  private noCheckForUSBMSDs = false;

  constructor() {
    this.logger = new Logger("Activator");
  }

  public async activate(
    context: vscode.ExtensionContext
  ): Promise<UI | undefined> {
    // TODO: maybe store the PicoMpyCom.getInstance() in a class variable
    this.settings = new Settings(context.workspaceState);

    // get the python env to be used
    const pythonApi = await PythonExtension.api();

    context.subscriptions.push(
      pythonApi.environments.onDidChangeActiveEnvironmentPath(
        (e: ActiveEnvironmentPathChangeEvent) => {
          this.pythonPath = e.path;
        }
      )
    );
    setImmediate(() => {
      // get currently selected environment
      this.pythonPath = pythonApi.environments.getActiveEnvironmentPath()?.path;
    });

    // execute async not await
    void vscode.commands.executeCommand(
      "setContext",
      ContextKeys.isActivated,
      true
    );

    this.stubs = new Stubs();
    await this.stubs.update(this.settings);

    const workspaceFolder = vscode.workspace.workspaceFolders;
    if (workspaceFolder !== undefined && workspaceFolder.length > 0) {
      const folder = workspaceFolder[0];
      // check if folder contains .micropico
      const micropico = vscode.Uri.joinPath(folder.uri, ".micropico");
      this.activationFilePresentAtLaunch = await vscode.workspace.fs
        .stat(micropico)
        .then(
          () => true,
          () => false
        );
    }

    // TODO: maybe not call getComDevice if no activationFile is present
    this.comDevice = await this.settings.getComDevice(
      !this.activationFilePresentAtLaunch
    );

    if (
      this.activationFilePresentAtLaunch &&
      (this.comDevice === undefined || this.comDevice === "")
    ) {
      this.comDevice = undefined;

      void vscode.window
        .showErrorMessage(
          "No COM device found. Please check your connection or ports and " +
            "try again. Alternatively you can set the manualComDevice " +
            "setting to the path of your COM device in the settings but " +
            "make sure to deactivate autoConnect. For Linux users: check you " +
            "sufficient permission to access the device file of the Pico.",
          "Open Settings"
        )
        .then((choice: "Open Settings" | undefined) => {
          if (choice === "Open Settings") {
            openSettings();
          }
        });
    }

    this.ui = new UI(this.settings);
    this.ui.init();

    if (this.activationFilePresentAtLaunch) {
      this.ui.show();
      this.setupAutoConnect();
    }

    context.subscriptions.push({
      dispose: async () => {
        await PicoMpyCom.getInstance().closeSerialPort();
      },
    });

    this.terminal = new Terminal(async () => {
      if (this.ui?.isHidden()) {
        await vscode.commands.executeCommand(commandPrefix + "connect");
        this.ui?.show();
      }
      const result = await PicoMpyCom.getInstance().runCommand(
        "\rfrom sys import implementation as _pe_impl, version as _pe_vers\n" +
          "print(_pe_vers.split('; ')[1] + '; ' + _pe_impl._machine)\n" +
          "del _pe_impl, _pe_vers"
      );
      if (result.type === OperationResultType.commandResponse) {
        return (
          "\x1b[1;32m" +
          result.response +
          "\x1b[0m" +
          'Type "help()" for more information or ' +
          ".help for custom vREPL commands." +
          "\r\n".repeat(2)
        );
      }

      return (
        "\x1b[38;2;255;165;0m" + // Set text color to orange (RGB: 255, 165, 0)
        "Failed to get MicroPython version and machine type.\r\n" +
        "Waiting for board to connect...\r\n" +
        "\x1b[0m\r\n" // Reset text color to default
      );
    });
    let commandExecuting = false;
    this.terminal.onDidSubmit(async (cmd: string) => {
      if (commandExecuting) {
        PicoMpyCom.getInstance().emit(
          PicoSerialEvents.relayInput,
          Buffer.from(cmd.trim(), "utf-8")
        );

        return;
      }

      if (!this.pythonPath) {
        this.showNoActivePythonError();

        return;
      }

      // TODO: maybe this.ui?.userOperationStarted();
      // this will make waiting for prompt falsethis.terminal.freeze();
      commandExecuting = true;
      const result = await PicoMpyCom.getInstance().runFriendlyCommand(
        cmd,
        (open: boolean) => {
          // TODO: maybe use
          //terminal.melt();
          if (open) {
            this.ui?.userOperationStarted();
          }
        },
        (data: Buffer) => {
          if (data.length > 0) {
            this.terminal?.write(data.toString("utf-8"));
          }
        },
        this.pythonPath,
        true
      );
      if (result.type !== OperationResultType.commandResult || !result.result) {
        // write red text into terminal
        this.terminal?.write("\x1b[31mException occured\x1b[0m\r\n");
        this.terminal?.write("\r\n");
        // important if for example a command requests input and the user
        // stops it with the universal stop command but had already entered
        // some input which hasn't been submitted yet
        this.terminal?.clean(true);
      }
      this.ui?.userOperationStopped();
      commandExecuting = false;
      this.terminal?.prompt();
    });
    this.terminal.onDidRequestTabComp(async (buf: string) => {
      this.terminal?.freeze();
      const nlIdx = buf.lastIndexOf("\n");
      const lastLineTrimmed = buf.slice(nlIdx + 1).trim();
      const result = await PicoMpyCom.getInstance().retrieveTabCompletion(
        lastLineTrimmed
      );
      // to be modified if simple tab completion
      let newUserInp = buf;
      if (
        result?.type === OperationResultType.tabComplete &&
        result.suggestions.trimEnd().length > lastLineTrimmed.length
      ) {
        if (result.isSimple) {
          newUserInp = newUserInp.replace(lastLineTrimmed, result.suggestions);
        } else {
          this.terminal?.write(result.suggestions);
        }
      }
      this.terminal?.prompt();
      this.terminal?.melt();

      // simulate user input to get the correct indentation
      for (const char of newUserInp) {
        this.terminal?.handleInput(char);
      }
    });

    try {
      // dispose old terminals on reactivation as otherwise they would be frozen
      vscode.window.terminals
        .find(term => term.creationOptions.name === TERMINAL_NAME)
        ?.dispose();
    } catch {
      this.logger.warn("Failed to dispose old terminals on reactivation.");
    }

    this.terminalOptions = {
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
      pty: this.terminal,
      //hideFromUser: false,
      location: vscode.TerminalLocation.Panel,
    };

    // register terminal profile provider
    context.subscriptions.push(
      vscode.window.registerTerminalProfileProvider(commandPrefix + "vrepl", {
        provideTerminalProfile: () => {
          if (this.terminalOptions) {
            return new vscode.TerminalProfile(this.terminalOptions);
          } else {
            return undefined;
          }
        },
      })
    );

    context.subscriptions.push(
      vscode.window.onDidOpenTerminal(async newTerminal => {
        if (newTerminal.creationOptions.name === TERMINAL_NAME) {
          if (this.terminal?.getIsOpen()) {
            // fix if all terminals are closed
            // but close() has not been called
            // for example if the vscode window was reloaded
            // in some combination of reopening and restoring
            // this situation can occur
            if (
              vscode.window.terminals.filter(
                t => t.creationOptions.name === TERMINAL_NAME
              ).length < 2
            ) {
              return;
            }

            void vscode.window.showWarningMessage(
              "Only one instance of MicroPico vREPL is recommended. " +
                "Closing new instance."
            );
            // would freeze old terminal if this is not set
            this.terminal.awaitClose();

            // close new one
            newTerminal.dispose();

            // focus on old one
            await focusTerminal(this.terminalOptions);

            // TODO: currently disreagarding if user has unsubmitted input in pty
            // send enter for new prompt
            //newTerminal.sendText("\n");
          }
        }
      })
    );

    /*
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
    );*/

    // register fs provider as early as possible
    this.picoFs = new PicoRemoteFileSystem();
    context.subscriptions.push(
      vscode.workspace.registerFileSystemProvider("pico", this.picoFs, {
        isCaseSensitive: true,
        isReadonly: false,
      })
    );

    if (
      this.settings.getBoolean(SettingsKey.openOnStart) &&
      this.comDevice !== undefined &&
      this.activationFilePresentAtLaunch
    ) {
      await focusTerminal(this.terminalOptions);
    }

    // [Command] help
    let disposable = vscode.commands.registerCommand(
      commandPrefix + "help",
      function () {
        void vscode.env.openExternal(
          vscode.Uri.parse(
            "https://github.com/paulober/MicroPico/blob/main/README.md"
          )
        );
      }
    );
    context.subscriptions.push(disposable);

    // [Command] List Commands
    disposable = vscode.commands.registerCommand(
      commandPrefix + "listCommands",
      () => {
        this.ui?.showQuickPick();
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Initialise
    disposable = vscode.commands.registerCommand(
      commandPrefix + "initialise",
      async (location?: string | vscode.Uri, pythonExecutable?: string) => {
        // set python executable
        if (pythonExecutable !== undefined && pythonExecutable.length > 0) {
          await pythonApi.environments.updateActiveEnvironmentPath(
            pythonExecutable
          );
        }

        let isCurrentWorkspace = false;
        if (
          location &&
          location instanceof vscode.Uri &&
          workspaceFolder &&
          workspaceFolder.length > 0
        ) {
          const folder = workspaceFolder[0];
          if (folder.uri.fsPath === location.fsPath) {
            isCurrentWorkspace = true;
          }
        }
        const path =
          location instanceof vscode.Uri ? location.fsPath : location;

        await this.stubs?.addToWorkspace(path);
        if (this.ui?.isHidden() && (!path || isCurrentWorkspace)) {
          await vscode.commands.executeCommand(commandPrefix + "connect");
          this.ui?.show();
        }
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Connect
    disposable = vscode.commands.registerCommand(
      commandPrefix + "connect",
      () => {
        /*this.comDevice = await this.settings?.getComDevice();
        if (this.comDevice !== undefined) {
          this.ui?.init();
          // TODO: verify that this does allow smooth transition between serialport devices
          await PicoMpyCom.getInstance().openSerialPort(this.comDevice);
        }*/
        this.setupAutoConnect();
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Disconnect
    disposable = vscode.commands.registerCommand(
      commandPrefix + "disconnect",
      async () => {
        clearInterval(this.autoConnectTimer);
        this.intentionalDisconnect = true;
        await PicoMpyCom.getInstance().closeSerialPort();
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Run File
    disposable = vscode.commands.registerCommand(
      commandPrefix + "run",
      async (resourceURI?: vscode.Uri, noSoftReset = false) => {
        if (PicoMpyCom.getInstance().isPortDisconnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        let file = resourceURI?.fsPath ?? (await getFocusedFile());

        if (
          file === undefined ||
          (resourceURI && resourceURI.scheme === "pico")
        ) {
          file = await getFocusedFile(true);
          if (file === undefined) {
            void vscode.window.showWarningMessage("No file open and focused.");

            return;
          } else {
            void vscode.commands.executeCommand(commandPrefix + "remote.run");

            return;
          }
        }
        const forceDisableSoftReset =
          this.settings?.getBoolean(SettingsKey.noSoftResetOnRun) ?? false;

        if (!noSoftReset && !forceDisableSoftReset) {
          await PicoMpyCom.getInstance().softReset();
        }
        await focusTerminal(this.terminalOptions);
        // TODO: maybe freeze terminal until this operation runs to prevent user input
        const data = await PicoMpyCom.getInstance().runFile(
          file,
          (open: boolean): void => {
            if (!open) {
              return;
            }

            commandExecuting = true;
            this.terminal?.cleanAndStore();
            this.ui?.userOperationStarted();
          },
          (data: Buffer) => {
            if (data.length > 0) {
              this.terminal?.write(data.toString("utf-8"));
            }
          }
        );
        if (!noSoftReset && !forceDisableSoftReset) {
          await PicoMpyCom.getInstance().softReset();
        }
        this.ui?.userOperationStopped();
        if (data.type !== OperationResultType.commandResult || !data.result) {
          this.logger.warn("Failed to execute script on Pico.");
        }
        commandExecuting = false;
        this.terminal?.restore();
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      commandPrefix + "remote.run",
      async (fileOverride?: string | vscode.Uri, noSoftReset = false) => {
        if (PicoMpyCom.getInstance().isPortDisconnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        if (!this.pythonPath) {
          this.showNoActivePythonError();

          return;
        }

        const file =
          (fileOverride !== undefined && typeof fileOverride === "string"
            ? fileOverride
            : undefined) ?? (await getFocusedFile(true));

        if (file === undefined) {
          void vscode.window.showWarningMessage(
            "No remote file open and focused."
          );

          return;
        }
        const forceDisableSoftReset =
          this.settings?.getBoolean(SettingsKey.noSoftResetOnRun) ?? false;

        if (!noSoftReset && !forceDisableSoftReset) {
          await PicoMpyCom.getInstance().softReset();
        }
        await focusTerminal(this.terminalOptions);
        await PicoMpyCom.getInstance().runRemoteFile(
          file,
          (open: boolean) => {
            if (!open) {
              return;
            }

            // tells the terminal that it should
            // emit input events to relay user input
            commandExecuting = true;
            this.terminal?.cleanAndStore();
            this.ui?.userOperationStarted();
          },
          (data: Buffer) => {
            if (data.length > 0) {
              this.terminal?.write(data.toString("utf-8"));
            }
          }
        );
        if (!noSoftReset && !forceDisableSoftReset) {
          await PicoMpyCom.getInstance().softReset();
        }
        this.ui?.userOperationStopped();
        commandExecuting = false;
        this.terminal?.restore();
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Run Selection
    disposable = vscode.commands.registerCommand(
      commandPrefix + "runselection",
      async () => {
        if (PicoMpyCom.getInstance().isPortDisconnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        if (!this.pythonPath) {
          this.showNoActivePythonError();

          return;
        }

        const code = getSelectedCodeOrLine();

        if (code === undefined) {
          void vscode.window.showWarningMessage("No code selected.");

          return;
        } else {
          await focusTerminal(this.terminalOptions);
          const data = await PicoMpyCom.getInstance().runFriendlyCommand(
            code,
            (open: boolean) => {
              // TODO: maybe make sure these kind of functions are only run once
              if (!open) {
                return;
              }

              commandExecuting = true;
              this.terminal?.cleanAndStore();
              this.ui?.userOperationStarted();
            },
            (data: Buffer) => {
              if (data.length > 0) {
                this.terminal?.write(data.toString("utf-8"));
              }
            },
            this.pythonPath,
            true
          );
          commandExecuting = false;
          this.ui?.userOperationStopped();
          if (data.type === OperationResultType.commandResult) {
            // const result = data as PyOutCommandResult;
            // TODO: reflect result.result in status bar
          }
          this.terminal?.restore();
        }
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Upload project
    disposable = vscode.commands.registerCommand(
      commandPrefix + "upload",
      async () => {
        if (PicoMpyCom.getInstance().isPortDisconnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }
        if (!this.settings) {
          void vscode.window.showErrorMessage(
            "Failed to upload project. Settings not available."
          );

          return;
        }
        this.settings.reload();

        const syncDir = await this.settings.requestSyncFolder("Upload");

        if (syncDir === undefined) {
          void vscode.window.showWarningMessage(
            "Upload canceled. No sync folder selected."
          );

          return;
        }

        // reducde replaces filter, map and concat
        const ignoredSyncItems = this.settings.getIngoredSyncItems().reduce(
          (acc: string[], item: string) => {
            // item must either be global or for the current sync folder otherwise it is ignored
            if (!item.includes(":") || item.split(":")[0] === syncDir[0]) {
              const finalItem = item.includes(":") ? item.split(":")[1] : item;
              acc.push(finalItem);
            }

            return acc;
          },
          ["**/.picowgo", "**/.micropico", "**/.DS_Store"]
        );

        if (this.settings.getBoolean(SettingsKey.gcBeforeUpload)) {
          // TODO: maybe do soft reboot instead of gc for bigger impact
          await PicoMpyCom.getInstance().runCommand(
            "import gc as __pe_gc; __pe_gc.collect(); del __pe_gc"
          );
        }

        void vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Uploading project",
            cancellable: true,
          },
          async (progress, token) => {
            // cancellation is possible
            token.onCancellationRequested(
              PicoMpyCom.getInstance().interruptExecution.bind(
                PicoMpyCom.getInstance()
              )
            );

            const data = await PicoMpyCom.getInstance().uploadProject(
              syncDir[1],
              this.settings!.getSyncFileTypes(),
              ignoredSyncItems,
              (
                totalChunksCount: number,
                currentChunk: number,
                relativePath: string
              ) => {
                if (currentChunk === 1) {
                  this.ui?.userOperationStarted();
                }
                this.logger.debug(
                  "upload progress: " +
                    `${currentChunk}/${totalChunksCount} - ${relativePath}`
                );

                // increment progress bar
                // can be done like this as this function is only called once per chunk
                progress.report({
                  increment: 100 / totalChunksCount,
                  message: relativePath,
                });
                // message: sep + relative(syncDir[1], status.filePath),
              }
            );
            this.ui?.userOperationStopped();

            // check if data is PyOut
            if (data === undefined) {
              return;
            }

            if (data.type === OperationResultType.commandResult) {
              if (data.result) {
                void vscode.window.showInformationMessage("Project uploaded.");
              } else {
                void vscode.window.showErrorMessage("Project upload failed.");

                return;
              }
            }
            // TODO: maybe make sure it's 100% if needed to make notification dissapear
            //progress.report({ increment: 100, message: "Project uploaded." });

            // moved outside so if not uploaded because file already exists it still resets
            if (this.settings!.getBoolean(SettingsKey.softResetAfterUpload)) {
              //await this.pyb?.softReset();
              await vscode.commands.executeCommand(
                commandPrefix + "reset.soft.listen"
              );
            }
          }
        );
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Upload file
    disposable = vscode.commands.registerCommand(
      commandPrefix + "uploadFile",
      async (resourceURI?: vscode.Uri) => {
        if (PicoMpyCom.getInstance().isPortDisconnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        if (!this.settings) {
          void vscode.window.showErrorMessage(
            "Failed to upload file. Settings not available."
          );

          return;
        }

        const file = resourceURI?.fsPath ?? (await getFocusedFile());

        if (file === undefined) {
          void vscode.window.showWarningMessage("No file open.");

          return;
        }

        // TODO: maybe upload relative to project root like uploadProject does with files

        if (this.settings.getBoolean(SettingsKey.gcBeforeUpload)) {
          await PicoMpyCom.getInstance().runCommand(
            "import gc as __pe_gc; __pe_gc.collect(); del __pe_gc"
          );
        }

        void vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Uploading file",
            cancellable: false,
          },
          async (progress, token) => {
            // cancellation is possible
            token.onCancellationRequested(
              PicoMpyCom.getInstance().interruptExecution.bind(
                PicoMpyCom.getInstance()
              )
            );

            const data = await PicoMpyCom.getInstance().uploadFiles(
              [file],
              "/",
              undefined,
              (
                totalChunksCount: number,
                currentChunk: number,
                relativePath: string
              ) => {
                if (currentChunk === 1) {
                  this.ui?.userOperationStarted();
                }

                // increment progress and set message to uploaded if 100% is reached
                progress.report({
                  increment: 100 / totalChunksCount,
                  message:
                    totalChunksCount === currentChunk
                      ? "Uploaded"
                      : // TODO: maybe add something like: uploading...
                        relativePath,
                });
              }
            );
            this.ui?.userOperationStopped();
            if (data && data.type === OperationResultType.commandResult) {
              if (data.result) {
                this.picoFs?.fileChanged(
                  vscode.FileChangeType.Created,
                  vscode.Uri.from({
                    scheme: "pico",
                    path: "/" + basename(file),
                  })
                );
                void vscode.window.showInformationMessage(
                  `${file} was uploaded successfully.`
                );
                // TODO: maybe make sure to set 100% if needed to make notification dissapear
                //progress.report({ increment: 100 });
                if (
                  this.settings!.getBoolean(SettingsKey.softResetAfterUpload)
                ) {
                  //await this.pyb?.softReset();
                  await vscode.commands.executeCommand(
                    commandPrefix + "reset.soft.listen"
                  );
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

    disposable = vscode.commands.registerCommand(
      commandPrefix + "downloadFile",
      async (resourceURI?: vscode.Uri) => {
        if (PicoMpyCom.getInstance().isPortDisconnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }
        if (!this.settings) {
          void vscode.window.showErrorMessage(
            "Failed to download file. Settings not available."
          );

          return;
        }

        const syncDir = await this.settings.requestSyncFolder("Download");

        if (syncDir === undefined) {
          void vscode.window.showWarningMessage(
            "Download canceled. No sync folder selected."
          );

          return;
        }

        const file =
          resourceURI?.fsPath.replaceAll("\\", "/") ??
          (await getFocusedFile())?.replaceAll("\\", "/");

        if (file === undefined) {
          void vscode.window.showWarningMessage("No file open.");

          return;
        }

        void vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Downloading file",
            cancellable: false,
          },
          async (progress, token) => {
            // cancellation is possible
            token.onCancellationRequested(
              PicoMpyCom.getInstance().interruptExecution.bind(
                PicoMpyCom.getInstance()
              )
            );

            const data = await PicoMpyCom.getInstance().downloadFiles(
              [file],
              // TODO: maybe attach relative path to syncDir[1] | or in different command
              join(syncDir[1], basename(file)),
              (
                totalChunksCount: number,
                currentChunk: number,
                relativePath: string
              ) => {
                if (currentChunk === 1) {
                  this.ui?.userOperationStarted();
                }
                // increment progress and set message to uploaded if 100% is reached
                progress.report({
                  increment: 100 / totalChunksCount,
                  message:
                    totalChunksCount === currentChunk
                      ? "Downloaded"
                      : // TODO: maybe add something like: uploading...
                        relativePath,
                });
              }
            );
            this.ui?.userOperationStopped();
            if (data && data.type === OperationResultType.commandResult) {
              if (data.result) {
                void vscode.window.showInformationMessage(
                  `${file} was downloaded successfully.`
                );
              } else {
                void vscode.window.showErrorMessage("File download failed.");
              }
            }
          }
        );
      }
    );

    // [Command] Download project
    // TODO: maybe add diffent warning methods for overwritten files in syncFolder
    disposable = vscode.commands.registerCommand(
      commandPrefix + "download",
      async () => {
        if (PicoMpyCom.getInstance().isPortDisconnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }
        if (!this.settings) {
          void vscode.window.showErrorMessage(
            "Failed to download project. Settings not available."
          );

          return;
        }

        const syncDir = await this.settings.requestSyncFolder("Download");

        if (syncDir === undefined) {
          void vscode.window.showWarningMessage(
            "Download canceled. No sync folder selected."
          );

          return;
        }

        void vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Downloading",
            cancellable: false,
          },
          async (progress, token) => {
            // cancellation is possible
            token.onCancellationRequested(
              PicoMpyCom.getInstance().interruptExecution.bind(
                PicoMpyCom.getInstance()
              )
            );

            const data = await PicoMpyCom.getInstance().downloadProject(
              syncDir[1],
              // TODO: add support for these three config options
              "/",
              undefined,
              undefined,
              (
                totalChunksCount: number,
                currentChunk: number,
                relativePath: string
              ) => {
                if (currentChunk === 1) {
                  this.ui?.userOperationStarted();
                }
                // increment progress
                progress.report({
                  increment: 100 / totalChunksCount,
                  message:
                    totalChunksCount === currentChunk
                      ? "Project downloaded"
                      : relativePath,
                });
              }
            );
            this.ui?.userOperationStopped();
            if (data && data.type === OperationResultType.commandResult) {
              if (data.result) {
                // TODO: maybe set to 100% if needed to make notification dissapear
                /*progress.report({
                  increment: 100,
                });*/
                // TODO: maybe second notification isn't needed
                void vscode.window.showInformationMessage(
                  "Project downloaded."
                );
              } else {
                void vscode.window.showErrorMessage("Project download failed.");
              }
            }
          }
        );
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Delete all files on Pico
    disposable = vscode.commands.registerCommand(
      commandPrefix + "deleteAllFiles",
      async () => {
        if (PicoMpyCom.getInstance().isPortDisconnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        const data = await PicoMpyCom.getInstance().deleteFolderRecursive("/");
        if (data.type === OperationResultType.commandResult) {
          if (data.result) {
            void vscode.window.showInformationMessage(
              "All files on Pico were deleted."
            );
          } else {
            void vscode.window.showErrorMessage(
              "File deletion on Pico failed."
            );
          }
        }
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Global settings
    disposable = vscode.commands.registerCommand(
      commandPrefix + "globalSettings",
      openSettings
    );
    context.subscriptions.push(disposable);

    // [Command] Workspace settings
    disposable = vscode.commands.registerCommand(
      commandPrefix + "workspaceSettings",
      () => openSettings(true)
    );
    context.subscriptions.push(disposable);

    // [Command] Toggle connection
    disposable = vscode.commands.registerCommand(
      commandPrefix + "toggleConnect",
      async () => {
        if (!PicoMpyCom.getInstance().isPortDisconnected()) {
          clearInterval(this.autoConnectTimer);
          this.intentionalDisconnect = true;
          await PicoMpyCom.getInstance().closeSerialPort();
        } else {
          this.comDevice = await this.settings?.getComDevice();
          if (this.comDevice === undefined) {
            void vscode.window.showErrorMessage(
              "No COM device found! Starting auto connect..."
            );
          } else {
            this.ui?.init();
            // TODO: check if this is a smooth transition between serialport devices
            await PicoMpyCom.getInstance().openSerialPort(this.comDevice);
          }
          this.setupAutoConnect();
        }
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Toggle virutal file-system
    disposable = vscode.commands.registerCommand(
      commandPrefix + "toggleFileSystem",
      () => {
        const findWorkspace = vscode.workspace.workspaceFolders?.find(
          folder => folder.uri.scheme === "pico"
        );
        if (findWorkspace !== undefined) {
          // remove findWorkspace
          vscode.workspace.updateWorkspaceFolders(findWorkspace.index, 1);

          return;
        }

        if (PicoMpyCom.getInstance().isPortDisconnected()) {
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
            name: "Mpy Remote Workspace",
          }
        );
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Open pin map
    disposable = vscode.commands.registerCommand(
      commandPrefix + "extra.pins",
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
          commandPrefix + "pinoout",
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
      commandPrefix + "extra.getSerial",
      async () => {
        const ports = await PicoMpyCom.getSerialPorts();
        if (ports.length > 1) {
          // TODO: maybe replace with quick pick in the future
          void vscode.window.showInformationMessage(
            "Found: " + ports.join(", ")
          );
        } else if (ports.length === 1) {
          writeIntoClipboard(ports[0]);
          void vscode.window.showInformationMessage(
            `Found: ${ports[0]} (copied to clipboard).`
          );
        } else {
          void vscode.window.showWarningMessage("No connected Pico found.");
        }
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Switch Pico
    disposable = vscode.commands.registerCommand(
      commandPrefix + "switchPico",
      async () => {
        const ports = await PicoMpyCom.getSerialPorts();
        if (ports.length === 0) {
          void vscode.window.showErrorMessage("No connected Pico found!");
        }

        const port = await vscode.window.showQuickPick(ports, {
          canPickMany: false,
          placeHolder:
            "Select your the COM port of the Pico you want to connect to",
          ignoreFocusOut: false,
        });

        if (port !== undefined) {
          this.comDevice = port;
          await PicoMpyCom.getInstance().openSerialPort(this.comDevice);
        }
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Soft reset pico
    disposable = vscode.commands.registerCommand(
      commandPrefix + "reset.soft",
      async () => {
        if (PicoMpyCom.getInstance().isPortDisconnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        const result = await PicoMpyCom.getInstance().softReset();
        if (result.type === OperationResultType.commandResult) {
          if (result.result) {
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
      commandPrefix + "reset.hard",
      async () => {
        // TODO: maybe instead just run the command and if it retuns a type none
        // response show warning message as otherwise a second warning for this
        // case would be required to be implemented
        if (PicoMpyCom.getInstance().isPortDisconnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        if (await this.bootPyWarning()) {
          return;
        }

        // performing hard reset in orange
        void vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Performing hard reset...",
            cancellable: true,
          },
          async (progress, token) => {
            token.onCancellationRequested(
              PicoMpyCom.getInstance().interruptExecution.bind(
                PicoMpyCom.getInstance()
              )
            );

            const result = await PicoMpyCom.getInstance().hardReset(
              (open: boolean) => {
                if (!open) {
                  return;
                }

                this.ui?.userOperationStarted();
              }
            );
            progress.report({ increment: 100 });
            this.ui?.userOperationStopped();
            if (result.type === OperationResultType.commandResult) {
              if (result.result) {
                void vscode.window.showInformationMessage(
                  "Hard reset is done."
                );
              } else {
                void vscode.window.showErrorMessage("Hard reset has failed.");
              }
            }
          }
        );
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Hard reset pico (interactive)
    disposable = vscode.commands.registerCommand(
      commandPrefix + "reset.hard.listen",
      async (terminalTriggered = false) => {
        // TODO: maybe instead just run the command and if it retuns a type none
        // response show warning message as otherwise a second warning for this
        // case would be required to be implemented
        if (PicoMpyCom.getInstance().isPortDisconnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        if (await this.bootPyWarning()) {
          if (terminalTriggered) {
            this.terminal?.clean(true);
            this.terminal?.prompt();
          }

          return;
        }

        await focusTerminal(this.terminalOptions);
        const result = await PicoMpyCom.getInstance().hardReset(
          (open: boolean) => {
            if (!open) {
              return;
            }

            commandExecuting = true;
            this.terminal?.cleanAndStore();
            this.ui?.userOperationStarted();

            // inform user about ongoing operation
            this.terminal?.write("\x1b[33mPerforming hard reset...\x1b[0m\r\n");
          },
          (data: Buffer) => {
            this.terminal?.write(data.toString("utf-8"));
          }
        );
        this.terminal?.restore();
        commandExecuting = false;
        this.ui?.userOperationStopped();
        if (result.type === OperationResultType.commandResult) {
          if (result.result) {
            void vscode.window.showInformationMessage("Hard reset done");
          } else {
            void vscode.window.showErrorMessage("Hard reset failed");
          }
        }
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      commandPrefix + "reset.soft.listen",
      async () => {
        if (PicoMpyCom.getInstance().isPortDisconnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        await focusTerminal(this.terminalOptions);
        const result = await PicoMpyCom.getInstance().sendCtrlD(
          (open: boolean) => {
            if (open) {
              commandExecuting = true;
              //terminal?.freeze();
              this.terminal?.clean(true);
              //terminal?.write("\r\n");
              this.ui?.userOperationStarted();
            }
          },
          (data: Buffer) => {
            this.terminal?.write(data.toString("utf-8"));
          }
        );
        commandExecuting = false;
        this.ui?.userOperationStopped();
        if (result.type === OperationResultType.commandResult) {
          if (result.result) {
            void vscode.window.showInformationMessage(
              "Interactive Soft Reset finished"
            );
          } else {
            void vscode.window.showErrorMessage("Soft reset failed");
          }
        }
        this.terminal?.melt();
        this.terminal?.prompt(true);
      }
    );

    disposable = vscode.commands.registerCommand(
      commandPrefix + "rtc.sync",
      async () => {
        if (PicoMpyCom.getInstance().isPortDisconnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        const result = await PicoMpyCom.getInstance().syncRtcTime();

        if (result.type === OperationResultType.commandResult) {
          if (result.result) {
            void vscode.window.showInformationMessage("RTC synchronized");
          } else {
            void vscode.window.showErrorMessage("RTC synchronization failed");
          }
        }
      }
    );

    disposable = vscode.commands.registerCommand(
      commandPrefix + "universalStop",
      async () => {
        if (
          PicoMpyCom.getInstance().isPortDisconnected() ||
          !this.ui?.isUserOperationOngoing()
        ) {
          void vscode.window.showInformationMessage("Nothing to stop.");

          return;
        }

        // interrupt most running programs
        PicoMpyCom.getInstance().interruptExecution();

        // wait for the program to stop
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    );

    // [Command] Check for firmware updates
    disposable = vscode.commands.registerCommand(
      commandPrefix + "extra.firmwareUpdates",
      () => {
        void vscode.env.openExternal(
          vscode.Uri.parse("https://micropython.org/download/")
        );
      }
    );
    context.subscriptions.push(disposable);

    // [Command] Check for firmware updates
    disposable = vscode.commands.registerCommand(
      commandPrefix + "extra.switchStubs",
      async () => {
        if (!this.settings) {
          void vscode.window.showErrorMessage(
            "Failed to switch stubs. Settings not available."
          );

          return;
        }

        // let use chose between stub port
        const stubPort = await vscode.window.showQuickPick(
          ["Included", ...STUB_PORTS.map(stubPortToDisplayString)],
          {
            canPickMany: false,
            placeHolder: "Select the stubs port you want to use",
            ignoreFocusOut: false,
          }
        );

        if (stubPort === undefined) {
          return;
        }

        if (stubPort.toLowerCase() === "included" && this.settings) {
          await installIncludedStubs(this.settings);

          void vscode.window.showInformationMessage("Included stubs selected.");
        } else {
          const availableStubVersions = await fetchAvailableStubsVersions(
            stubPort
          );
          const versions: string[] = [];

          Object.entries(availableStubVersions).forEach(([key, values]) => {
            // Map each value to "key - value" and push to resultArray
            versions.push(
              ...values.map(value =>
                // differentiate between multiple stub ports and single
                // to reduce UI clutter for version selection
                // after a user selected a certain port already
                // but still support multiple ports per selection
                Object.keys(availableStubVersions).length > 1
                  ? `${stubPortToDisplayString(key)} - ${value}`
                  : value
              )
            );
          });

          // show quick pick
          const version = await vscode.window.showQuickPick(versions, {
            canPickMany: false,
            placeHolder: "Select the stubs version you want to use",
            ignoreFocusOut: false,
          });

          if (version === undefined) {
            return;
          }

          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "Downloading stubs, this may take a while...",
              cancellable: false,
            },
            async (progress, token) => {
              // cancellation is not possible
              token.onCancellationRequested(() => undefined);
              const versionParts = version.includes(" - ")
                ? version.split(" - ")
                : [Object.keys(availableStubVersions)[0], version];

              // TODO: implement cancellation
              const result = await installStubsByVersion(
                versionParts[1],
                version.includes(" - ")
                  ? displayStringToStubPort(versionParts[0])
                  : versionParts[0],
                this.settings!,
                this.pythonPath
              );

              if (result) {
                progress.report({
                  increment: 100,
                  message: "Stubs installed.",
                });
                void vscode.window.showInformationMessage("Stubs installed.");
              } else {
                void vscode.window.showErrorMessage(
                  "Stubs installation failed."
                );
              }
            }
          );
        }
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      commandPrefix + "garbageCollect",
      () => {
        if (PicoMpyCom.getInstance().isPortDisconnected()) {
          void vscode.window.showWarningMessage(
            "Please connect to the Pico first."
          );

          return;
        }

        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Running garbage collector...",
            cancellable: false,
          },
          async progress => {
            // gc currently not cancelable

            const result = await PicoMpyCom.getInstance().garbageCollect();
            progress.report({ increment: 100 });
            if (
              result.type === OperationResultType.commandResult &&
              result.result
            ) {
              void vscode.window.showInformationMessage(
                "Garbage collection done"
              );

              return;
            }

            void vscode.window.showErrorMessage("Garbage collection failed");
          }
        );
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      commandPrefix + "flashPico",
      async () => {
        const result = await vscode.window.showInformationMessage(
          "This will flash the latest MicroPython firmware to your Pico. " +
            "Do you want to continue?",
          {
            modal: true,
            detail:
              "Note: Only Raspberry Pi Pico boards are supported. " +
              "Make sure it is connected and in BOOTSEL mode. " +
              "You can verify this by checking if a drive " +
              "labeled RPI-RP2 or RP2350 is mounted.",
          }
        );

        if (result === undefined) {
          return;
        }

        await flashPicoInteractively(true);
      }
    );
    context.subscriptions.push(disposable);

    const packagesWebviewProvider = new PackagesWebviewProvider(
      context.extensionUri
    );
    const deviceWifiProvider = new DeviceWifiProvider(
      packagesWebviewProvider,
      // TODO: maybe use extensionUri
      context.extensionPath
    );
    disposable = vscode.commands.registerCommand(
      commandPrefix + "device-wifi.refresh",
      async () => {
        await deviceWifiProvider.checkConnection();
      }
    );
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(
      commandPrefix + "device-wifi.itemClicked",
      deviceWifiProvider.elementSelected.bind(deviceWifiProvider)
    );
    context.subscriptions.push(disposable);

    disposable = vscode.window.registerWebviewViewProvider(
      PackagesWebviewProvider.viewType,
      packagesWebviewProvider
    );
    context.subscriptions.push(disposable);

    disposable = vscode.window.registerTreeDataProvider(
      DeviceWifiProvider.viewType,
      deviceWifiProvider
    );
    context.subscriptions.push(disposable);

    // auto install selected stubs of a project they aren't installed yet
    // retuns null if stubs are installed and the pip package name plus version if not
    const stubsInstalledResult: string | null = await stubsInstalled(
      this.settings
    );
    if (stubsInstalledResult !== null) {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title:
            "Downloading stubs for current project, " +
            "this may take a while...",
          cancellable: false,
        },
        async (progress, token) => {
          // cancellation is not possible
          token.onCancellationRequested(() => undefined);

          // TODO: implement cancellation
          const result = await installStubsByPipVersion(
            stubsInstalledResult,
            this.settings!
          );

          if (result) {
            progress.report({
              increment: 100,
              message: "Stubs installed successfully.",
            });
            void vscode.window.showInformationMessage(
              "Stubs installed successfully."
            );
          } else {
            void vscode.window.showErrorMessage(
              "Stubs installation failed. " +
                "Selecting a different version might help."
            );
          }
        }
      );
    }

    return this.ui;
  }

  private boundOnError = this.boardOnError.bind(this);
  private boundOnExit = this.boardOnExit.bind(this);
  private boundOnOpen = this.boardOnOpen.bind(this);
  /**
   * Used to indicate that the disconnect is intentional
   * stop the setupAutoConnect to be armed again.
   */
  private intentionalDisconnect = false;

  private setupAutoConnect(): void {
    if (this.intentionalDisconnect) {
      this.intentionalDisconnect = false;
      // TODO: maybe also remove listeners here

      return;
    }
    if (this.settings === undefined) {
      this.logger.error("Settings not provided for setupAutoConnect");

      return;
    }
    // if disconnected: check in a reasonable interval if a port is available and then connect
    // else: just subscribe to the closed event once and if it is triggered start the disconnected
    // routine and reflect the disconnected status in the UI
    const instance = PicoMpyCom.getInstance();

    // First, remove any existing listeners for the event
    instance.off(PicoSerialEvents.portError, this.boundOnError);
    instance.off(PicoSerialEvents.portClosed, this.boundOnExit);
    instance.off(PicoSerialEvents.portOpened, this.boundOnOpen);

    instance.on(PicoSerialEvents.portError, this.boundOnError);
    instance.on(PicoSerialEvents.portClosed, this.boundOnExit);
    instance.on(PicoSerialEvents.portOpened, this.boundOnOpen);

    // TODO: check this condition, maybe this causes setupAutoConnect to be retriggered
    // if the settings ever change, maybe listen to settings change event
    if (
      (this.settings.getString(SettingsKey.manualComDevice)?.length ?? 0) <=
        0 &&
      !this.settings.getBoolean(SettingsKey.autoConnect)
    ) {
      return;
    }

    const onAutoConnect = (): void => {
      if (!PicoMpyCom.getInstance().isPortDisconnected()) {
        clearInterval(this.autoConnectTimer);

        return;
      }

      // make sure the user is informed about the connection state
      // TODO: maybe called to often, reduce by only running at change of con state
      this.ui?.refreshState(false);
      this.settings?.reload();
      const autoPort = this.settings?.getBoolean(SettingsKey.autoConnect);
      const manualComDevice =
        this.settings?.getString(SettingsKey.manualComDevice) ?? "";

      // TODO: maybe not reconnect to this.comDevice if autoConnect is disabled
      if (
        !autoPort &&
        this.comDevice === undefined &&
        manualComDevice.length <= 0
      ) {
        return;
      }

      PicoMpyCom.getSerialPorts()
        .then(async ports => {
          if (ports.length === 0) {
            if (!this.noCheckForUSBMSDs) {
              // must be reset after checkForUSBMSDs if it want to continue
              this.noCheckForUSBMSDs = true;
              await this.checkForUSBMSDs();
            }

            return;
          }

          // so this doesn't get triggered again while trying to connect
          clearInterval(this.autoConnectTimer);

          // try to connect to previously connected device first
          if (this.comDevice && ports.includes(this.comDevice)) {
            // try to reconnect
            await PicoMpyCom.getInstance().openSerialPort(this.comDevice);
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (!PicoMpyCom.getInstance().isPortDisconnected()) {
              return;
            }
          }

          // no elseif as if the previous connection attemp failed try the next device
          // TODO: maybe the delay above is not needed
          if (autoPort) {
            const port = ports[0];
            this.comDevice = port;
            await PicoMpyCom.getInstance().openSerialPort(port);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else if (
            manualComDevice.length > 0 &&
            ports.includes(manualComDevice)
          ) {
            this.comDevice = manualComDevice;
            await PicoMpyCom.getInstance().openSerialPort(manualComDevice);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // restart this interval
          this.autoConnectTimer = setInterval(onAutoConnect, 1500);
        })
        .catch(error => {
          this.logger.error("Failed to get serial ports: " + error);
        });
    };

    // required because setInterval would call it first after 1500ms
    onAutoConnect();
    // setup interval
    this.autoConnectTimer = setInterval(onAutoConnect, 1500);
  }

  private async checkForUSBMSDs(): Promise<void> {
    const result = await flashPicoInteractively();
    this.noCheckForUSBMSDs = result;
  }

  private showNoActivePythonError(): void {
    vscode.window
      .showWarningMessage(
        "Python path not found. Please check your Python environment.\n" +
          "See the Python extension for instructions on how to select " +
          "a Python interpreter.",
        "Open Documentation"
      )
      .then(selection => {
        if (selection?.toLocaleLowerCase().startsWith("open")) {
          vscode.env.openExternal(
            vscode.Uri.parse(
              // eslint-disable-next-line max-len
              "https://code.visualstudio.com/docs/languages/python#_environments"
            )
          );
        }
      });
  }

  private boardOnError(error?: Error): void {
    if (error) {
      void vscode.window.showErrorMessage(
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "Unknown error"
      );
    }
  }

  /**
   * Handles the exit event of the board connection.
   *
   * @param error The error that caused the exit event.
   */
  private boardOnExit(error?: Error | string): void {
    // TODO: needs some adjustment (maybe) because it will be triggered multiple times
    // if an error with the connection occurs
    this.ui?.refreshState(false);
    if (error === undefined) {
      this.logger.info(`Connection to board was closed.`);
      if (this.comDevice !== undefined) {
        void vscode.window.showInformationMessage("Disconnected from board.");
        this.terminal?.freeze();
        this.terminal?.write(
          "\r\n\x1b[31mConnection has been closed.\x1b[0m\r\n"
        );
        this.terminal?.clean();
      }
    } else if (!PicoMpyCom.getInstance().isPortDisconnected()) {
      // TODO: check the reason of this case or if it should be handled differently
      // true if the connection was lost after a board has been connected successfully
      this.logger.error(
        `Connection to board lost: ${
          error instanceof Error ? error.message : error
        }`
      );
      void vscode.window.showErrorMessage("Connection to board has been lost.");
    }
    this.setupAutoConnect();
  }

  private boardOnOpen(): void {
    if (this.ui?.getState()) {
      return;
    }
    if (!this.settings) {
      void vscode.window.showErrorMessage(
        "Failed to connect to board. Settings not available."
      );

      return;
    }

    this.logger.debug(
      "Connected to a board. Now executing *OnConnect stuff..."
    );
    this.logger.info("Connection to board successfully established");

    if (
      !this.activationFilePresentAtLaunch &&
      this.settings.getBoolean(SettingsKey.openOnStart) &&
      this.comDevice !== undefined
    ) {
      void focusTerminal(this.terminalOptions);
      // only keep for first connection on a launch without activation file
      this.activationFilePresentAtLaunch = false;
    }

    if (this.terminal?.getIsOpen()) {
      this.terminal?.cls();
      //this.terminal?.open(undefined);
      void focusTerminal(this.terminalOptions);
      this.terminal?.callOpeningCb();
    } else {
      void focusTerminal(this.terminalOptions);
    }

    void vscode.window.showInformationMessage(
      "Connection to MicoPython board established."
    );

    const scriptToExecute = this.settings.getString(
      SettingsKey.executeOnConnect
    );
    if (scriptToExecute !== undefined && scriptToExecute.trim() !== "") {
      void vscode.commands.executeCommand(
        commandPrefix + "remote.run",
        scriptToExecute,
        true
      );
    }

    const moduleToImport = this.settings.getString(SettingsKey.importOnConnect);
    if (moduleToImport !== undefined && moduleToImport.trim() !== "") {
      // TODO: check that voiding this is correct
      void PicoMpyCom.getInstance().runCommand(`import ${moduleToImport}`);
    }
    this.ui?.refreshState(true);
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

  private async bootPyWarning(): Promise<boolean> {
    const bootPyResult = await PicoMpyCom.getInstance().getItemStat("/boot.py");

    if (
      bootPyResult.type === OperationResultType.getItemStat &&
      bootPyResult.stat !== null
    ) {
      // warn that boot.py could prevent device from entering REPL or delay the amount we have to wait before we can reconnect
      const result = await vscode.window.showWarningMessage(
        "A boot.py script is present on the Pico. " +
          "If it contains an infinite loop or long running code, " +
          "the Pico may not enter the REPL or take longer to do so. " +
          "Do you want to continue?",
        { modal: true },
        "Yes"
      );

      return result !== "Yes";
    } else {
      void vscode.window.showErrorMessage(
        "Failed to retrieve details about the boot.py file."
      );
    }

    // continue as we don't know if there is a boot.py file
    // or the user wants to continue even if there is one
    return false;
  }
}

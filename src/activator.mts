import * as vscode from "vscode";
import UI from "./ui.mjs";
import {
  TERMINAL_NAME,
  commandPrefix,
  focusTerminal,
  openSettings,
} from "./api.mjs";
import Stubs, {
  installStubsByPipVersion,
  stubsInstalled,
} from "./stubs.mjs";
import Settings, { SettingsKey } from "./settings.mjs";
import Logger from "./logger.mjs";
import { PicoRemoteFileSystem } from "./filesystem.mjs";
import { Terminal } from "./terminal.mjs";
import { ContextKeys } from "./models/contextKeys.mjs";
import DeviceWifiProvider from "./activitybar/deviceWifiTree.mjs";
import PackagesWebviewProvider from "./activitybar/packagesWebview.mjs";
import PlotterViewProvider, {
  PLOTTER_VIEW_ID,
} from "./plotter/plotterView.mjs";
import { OutputRouter } from "./output/outputRouter.mjs";
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
import { StringDecoder } from "string_decoder";
import { registerHelpCommands } from "./commands/helpCommands.mjs";
import { registerProjectCommands } from "./commands/projectCommands.mjs";
import { SessionContext } from "./commands/sessionContext.mjs";
import { SoftResetCommand } from "./commands/softResetCommand.mjs";
import { GarbageCollectCommand } from "./commands/garbageCollectCommand.mjs";
import { RtcSyncCommand } from "./commands/rtcSyncCommand.mjs";
import { DeleteAllFilesCommand } from "./commands/deleteAllFilesCommand.mjs";
import { UniversalStopCommand } from "./commands/universalStopCommand.mjs";
import { HardResetCommand } from "./commands/hardResetCommand.mjs";
import { ToggleFileSystemCommand } from "./commands/toggleFileSystemCommand.mjs";
import { SwitchStubsCommand } from "./commands/switchStubsCommand.mjs";
import { RunSelectionCommand } from "./commands/runSelectionCommand.mjs";
import { RemoteRunCommand } from "./commands/remoteRunCommand.mjs";
import { RunCommand } from "./commands/runCommand.mjs";
import { UploadCommand } from "./commands/uploadCommand.mjs";
import { UploadFileCommand } from "./commands/uploadFileCommand.mjs";
import { DownloadFileCommand } from "./commands/downloadFileCommand.mjs";
import { DownloadCommand } from "./commands/downloadCommand.mjs";
import { SoftResetListenCommand } from "./commands/softResetListenCommand.mjs";
import { HardResetListenCommand } from "./commands/hardResetListenCommand.mjs";
import {
  ConnectionManager,
  type ConnectionDeps,
} from "./connection/connectionManager.mjs";

/*const pkg: {} | undefined = vscode.extensions.getExtension("paulober.pico-w-go")
  ?.packageJSON as object;*/

export default class Activator {
  private logger: Logger;
  private ui?: UI;
  private stubs?: Stubs;
  private picoFs?: PicoRemoteFileSystem;
  private terminal?: Terminal;
  private terminalOptions?: vscode.ExtensionTerminalOptions;
  private activationFilePresentAtLaunch = false;
  private settings?: Settings;

  private connection?: ConnectionManager;
  private output?: OutputRouter;

  constructor() {
    this.logger = new Logger("Activator");
  }

  public async activate(
    context: vscode.ExtensionContext,
  ): Promise<UI | undefined> {
    // TODO: maybe store the PicoMpyCom.getInstance() in a class variable
    this.settings = new Settings(context.workspaceState);
    const ctx = new SessionContext(this.settings);

    // The connection lifecycle (auto-connect polling, reconnect, board events)
    // lives in its own manager; the activator only injects the side effects it
    // needs and the view-side work to run once a board opens.
    const connectionDeps: ConnectionDeps = {
      listSupportedPorts: vidPidPairs =>
        PicoMpyCom.getSerialPorts(vidPidPairs),
      listAllPorts: () => PicoMpyCom.getAllSerialPorts(),
      checkForUsbMsd: () => flashPicoInteractively(),
      onConnected: () => this.onBoardConnected(),
    };
    const connection = new ConnectionManager(ctx, connectionDeps);
    this.connection = connection;

    // get the python env to be used
    const pythonApi = await PythonExtension.api();

    context.subscriptions.push(
      pythonApi.environments.onDidChangeActiveEnvironmentPath(
        (e: ActiveEnvironmentPathChangeEvent) => {
          ctx.pythonPath = e.path;
        },
      ),
    );
    setImmediate(() => {
      // get currently selected environment
      ctx.pythonPath = pythonApi.environments.getActiveEnvironmentPath()?.path;
    });

    // execute async not await
    void vscode.commands.executeCommand(
      "setContext",
      ContextKeys.isActivated,
      true,
    );

    this.stubs = new Stubs(context.extensionUri);
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
          () => false,
        );
    }

    // TODO: maybe not call getComDevice if no activationFile is present
    connection.comDevice = await this.settings.getComDevice(
      !this.activationFilePresentAtLaunch,
    );

    if (
      this.activationFilePresentAtLaunch &&
      (connection.comDevice === undefined || connection.comDevice === "")
    ) {
      connection.comDevice = undefined;

      void vscode.window
        .showErrorMessage(
          "No COM device found. Please check your connection or ports and " +
            "try again. Alternatively you can set the manualComDevice " +
            "setting to the path of your COM device in the settings but " +
            "make sure to deactivate autoConnect. For Linux users: check you " +
            "sufficient permission to access the device file of the Pico.",
          "Open Settings",
        )
        .then((choice: "Open Settings" | undefined) => {
          if (choice === "Open Settings") {
            openSettings();
          }
        });
    }

    this.ui = new UI(this.settings);
    this.ui.init();
    ctx.ui = this.ui;

    if (this.activationFilePresentAtLaunch) {
      this.ui.show();
      connection.setupAutoConnect();
    }

    context.subscriptions.push({
      dispose: async () => {
        connection.dispose();
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
          "del _pe_impl, _pe_vers",
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

    this.terminal.onDidSubmit(async (cmd: string) => {
      if (ctx.commandExecuting) {
        PicoMpyCom.getInstance().emit(
          PicoSerialEvents.relayInput,
          Buffer.from(cmd.trim(), "utf-8"),
        );

        return;
      }

      if (!ctx.pythonPath) {
        ctx.showNoActivePythonError();

        return;
      }

      const decoder = new StringDecoder("utf-8");
      // TODO: maybe this.ui?.userOperationStarted();
      // this will make waiting for prompt falsethis.terminal.freeze();
      ctx.commandExecuting = true;
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
            this.output?.route(data);
            const text = decoder.write(data); // streaming decode
            if (text.length > 0) {
              this.terminal?.write(text);
            }
          }
        },
        ctx.pythonPath,
        true,
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
      ctx.commandExecuting = false;
      this.terminal?.prompt();
    });
    this.terminal.onDidRequestTabComp(async (buf: string) => {
      this.terminal?.freeze();
      const nlIdx = buf.lastIndexOf("\n");
      const lastLineTrimmed = buf.slice(nlIdx + 1).trim();
      const result =
        await PicoMpyCom.getInstance().retrieveTabCompletion(lastLineTrimmed);
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
      iconPath: vscode.Uri.joinPath(
        context.extensionUri,
        "images",
        "logo-256.png",
      ),
      isTransient: true,
      pty: this.terminal,
      //hideFromUser: false,
      location: vscode.TerminalLocation.Panel,
    };
    // mirror the set-once services into the shared context for the commands
    ctx.terminal = this.terminal;
    ctx.terminalOptions = this.terminalOptions;

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
      }),
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
                t => t.creationOptions.name === TERMINAL_NAME,
              ).length < 2
            ) {
              return;
            }

            void vscode.window.showWarningMessage(
              "Only one instance of MicroPico vREPL is recommended. " +
                "Closing new instance.",
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
      }),
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
    ctx.picoFs = this.picoFs;
    context.subscriptions.push(
      vscode.workspace.registerFileSystemProvider("pico", this.picoFs, {
        isCaseSensitive: true,
        isReadonly: false,
      }),
    );

    if (
      this.settings.getBoolean(SettingsKey.openOnStart) &&
      connection.comDevice !== undefined &&
      this.activationFilePresentAtLaunch
    ) {
      await focusTerminal(this.terminalOptions);
    }

    // Informational/utility commands (help, list commands, pin map,
    // list serial ports, firmware updates and flash Pico)
    registerHelpCommands(context, {
      ui: this.ui,
      settings: this.settings,
    });

    // [Commands] Project/settings leaf commands (initialise, newProject,
    // globalSettings, workspaceSettings)
    registerProjectCommands(context, {
      ui: this.ui,
      stubs: this.stubs,
      pythonApi,
      workspaceFolder,
    });

    // [Command] Connect
    let disposable = vscode.commands.registerCommand(
      commandPrefix + "connect",
      () => connection.connect(),
    );
    context.subscriptions.push(disposable);

    // [Command] Disconnect
    disposable = vscode.commands.registerCommand(
      commandPrefix + "disconnect",
      () => connection.disconnect(),
    );
    context.subscriptions.push(disposable);

    new RunCommand(ctx).register(context);

    new RemoteRunCommand(ctx).register(context);

    new RunSelectionCommand(ctx).register(context);

    new UploadCommand(ctx).register(context);

    new UploadFileCommand(ctx).register(context);

    new DownloadFileCommand(ctx).register(context);

    new DownloadCommand(ctx).register(context);

    new DeleteAllFilesCommand(ctx).register(context);

    // [Command] Toggle connection
    disposable = vscode.commands.registerCommand(
      commandPrefix + "toggleConnect",
      () => connection.toggleConnect(),
    );
    context.subscriptions.push(disposable);

    new ToggleFileSystemCommand(ctx).register(context);

    // [Command] Switch Pico
    disposable = vscode.commands.registerCommand(
      commandPrefix + "switchPico",
      () => connection.switchPico(),
    );
    context.subscriptions.push(disposable);

    new SoftResetCommand(ctx).register(context);

    new HardResetCommand(ctx).register(context);

    new HardResetListenCommand(ctx).register(context);
    new SoftResetListenCommand(ctx).register(context);

    new RtcSyncCommand(ctx).register(context);
    new UniversalStopCommand(ctx).register(context);

    new SwitchStubsCommand(ctx).register(context);

    new GarbageCollectCommand(ctx).register(context);

    const packagesWebviewProvider = new PackagesWebviewProvider(
      context.extensionUri,
    );
    const deviceWifiProvider = new DeviceWifiProvider(
      packagesWebviewProvider,
      // TODO: maybe use extensionUri
      context.extensionPath,
    );
    disposable = vscode.commands.registerCommand(
      commandPrefix + "device-wifi.refresh",
      async () => {
        await deviceWifiProvider.checkConnection();
      },
    );
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(
      commandPrefix + "device-wifi.itemClicked",
      deviceWifiProvider.elementSelected.bind(deviceWifiProvider),
    );
    context.subscriptions.push(disposable);

    disposable = vscode.window.registerWebviewViewProvider(
      PackagesWebviewProvider.viewType,
      packagesWebviewProvider,
    );
    context.subscriptions.push(disposable);

    const plotterProvider = new PlotterViewProvider(context.extensionUri);
    this.output = new OutputRouter(plotterProvider);
    ctx.output = this.output;
    this.output.registerRedirectCommand(context);
    disposable = vscode.window.registerWebviewViewProvider(
      PLOTTER_VIEW_ID,
      plotterProvider,
    );
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(
      commandPrefix + "openPlotter",
      () => void vscode.commands.executeCommand(`${PLOTTER_VIEW_ID}.focus`),
    );
    context.subscriptions.push(disposable);

    disposable = vscode.window.registerTreeDataProvider(
      DeviceWifiProvider.viewType,
      deviceWifiProvider,
    );
    context.subscriptions.push(disposable);

    // auto install selected stubs of a project they aren't installed yet
    // retuns null if stubs are installed and the pip package name plus version if not
    const stubsInstalledResult: string | null = await stubsInstalled(
      this.settings,
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
            this.settings!,
          );

          if (result) {
            progress.report({
              increment: 100,
              message: "Stubs installed successfully.",
            });
            void vscode.window.showInformationMessage(
              "Stubs installed successfully.",
            );
          } else {
            void vscode.window.showErrorMessage(
              "Stubs installation failed. " +
                "Selecting a different version might help.",
            );
          }
        },
      );
    }

    return this.ui;
  }

  /**
   * Terminal focus and first-connect openOnStart handling, invoked by the
   * {@link ConnectionManager} once a board opens. Stays on the activator
   * because it depends on activator-owned view state (terminal, activation
   * file); the rest of the open handler lives in the manager.
   */
  private onBoardConnected(): void {
    if (
      !this.activationFilePresentAtLaunch &&
      this.settings?.getBoolean(SettingsKey.openOnStart) &&
      this.connection?.comDevice !== undefined
    ) {
      void focusTerminal(this.terminalOptions);
      // only keep for first connection on a launch without activation file
      this.activationFilePresentAtLaunch = false;
    }

    if (this.terminal?.getIsOpen()) {
      this.terminal.cls();
      void focusTerminal(this.terminalOptions);
      this.terminal.callOpeningCb();
    } else {
      void focusTerminal(this.terminalOptions);
    }
  }


}

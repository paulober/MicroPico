import * as vscode from 'vscode';
import SettingsWrapper, { SettingsKey } from './settingsWrapper';
import { exec } from 'child_process';
import StubsManager from './stubsManager';
import Pyboard from './rp2/pyboard';
import PanelView from './panelView';
import SerialDolmatcher from './serialDolmatcher';
import * as path from 'path';
import { PicoWFs } from './picowfs/picowfs';

const pkg = vscode.extensions.getExtension('paulober.pico-w-go')?.packageJSON;

export default class Activator {
  public async activate(context: vscode.ExtensionContext) {
    let sw = new SettingsWrapper(context.workspaceState);

    await this.checkPythonVersion(sw);

    // no supported python installation found
    if (sw.detectedPythonPath === null) {
      for (let item of pkg.contributes.commands) {
        let disposable = vscode.commands.registerCommand(
          item.command,
          function () {
            vscode.window.showErrorMessage(
              'Pico-W-Go was unable to start, most likely because no supported (>= 3.9) Python installation was found on your machine.'
            );
          }
        );
        context.subscriptions.push(disposable);
      }

      let choice = await vscode.window.showErrorMessage(
        'Python3.9 or newer is not detected on this machine so Pico-W-Go cannot work. Ensure it is in your PATH or set a python_path value in the Global Settings. Then restart VS Code.',
        'OK',
        'Global Settings'
      );

      if (choice === 'Global Settings') {
        sw.api.openSettings();
      }

      return;
    }

    const stubsMngr = new StubsManager();
    await stubsMngr.updateStubs();

    const pb = new Pyboard(sw);

    const v = new PanelView(pb, sw);

    const isFirstTimeStart = context.globalState
      .keys()
      .some((k) => k === 'picowgo.notFirstStart');
    const serialDolmatcher = new SerialDolmatcher(
      {},
      pb,
      v,
      sw,
      isFirstTimeStart
    );
    if (isFirstTimeStart) {
      context.globalState.update('picowgo.notFirstStart', true);
    }

    // do initialize PanelView after binding it to serialdolmatcher for events to trigger in sd
    const resultInitTerminal = await v.initialize(
      context.extensionPath,
      (options: vscode.ProviderResult<vscode.TerminalProfile>) => {
        const disposable = vscode.window.registerTerminalProfileProvider(
          'picowgo.terminalProfile',
          {
            provideTerminalProfile(
              token: vscode.CancellationToken
            ): vscode.ProviderResult<vscode.TerminalProfile> {
              return options;
            },
          }
        );
        context.subscriptions.push(disposable);
      }
    );

    if (!resultInitTerminal) {
      vscode.window.showErrorMessage(
        'Pico-W-Go was unable to start, could not register terminal profile provider.'
      );
      return;
    }

    const terminal = v.terminal;

    // close serial port safely to avoid permission denied
    // errors when a new connection to serial port will be created
    context.subscriptions.push({
      dispose() {
        serialDolmatcher.disconnect();
      },
    });

    const picowFs = new PicoWFs(serialDolmatcher);

    // register virtual filesystem provider
    context.subscriptions.push(
      vscode.workspace.registerFileSystemProvider('picowfs', picowFs, {
        isCaseSensitive: true
        //isReadonly: false,
      })
    );

    // register commands

    let disposable = vscode.commands.registerCommand(
      'picowgo.help',
      function () {
        terminal?.show();
        vscode.env.openExternal(
          vscode.Uri.parse(
            'https://github.com/paulober/Pico-W-Go/blob/main/README.md'
          )
        );
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.listCommands',
      function () {
        v.showQuickPick();
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.initialise',
      function () {
        stubsMngr.addToWorkspace();
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.openPicoRemoteWorkspace',
      function () {
        /*vscode.commands.executeCommand(
          'vscode.openFolder',
          vscode.Uri.parse("picowfs:///", true)
        );*/

        // check if pico is connected
        if (pb.connected) {
          vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, 0, {
            uri: vscode.Uri.parse("picowfs:/"),
            name: "Pico (W) Remote Workspace"
          });
        } else {
          vscode.window.showErrorMessage("Cannot open remote file system. No Pico (W) is connected.");
        }
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.connect',
      async function () {
        terminal?.show();
        await serialDolmatcher.connect();
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.run',
      async function () {
        terminal?.show();
        await serialDolmatcher.run();
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.runselection',
      async function () {
        terminal?.show();
        await serialDolmatcher.runSelection();
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.upload', function () {
      terminal?.show();
      serialDolmatcher.upload();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.uploadFile',
      function () {
        terminal?.show();
        serialDolmatcher.uploadFile();
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.download',
      async function () {
        terminal?.show();
        await serialDolmatcher.download();
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.deleteAllFiles',
      function () {
        terminal?.show();

        setTimeout(async function () {
          await serialDolmatcher.deleteAllFiles();
        }, 500);
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.globalSettings',
      async function () {
        await serialDolmatcher.openGlobalSettings();
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.disconnect',
      async function () {
        await serialDolmatcher.disconnect();
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.toggleConnect',
      async function () {
        if (!serialDolmatcher.board.connected) {
          terminal?.show();
        }
        await serialDolmatcher.toggleConnect();
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.ftp',
      async function () {
        if (!serialDolmatcher.board.connected) {
          terminal?.show();
        }
        await serialDolmatcher.toggleFtp();
      }
    );
    context.subscriptions.push(disposable);

    const pinmap = this.getPinMapHtml;
    disposable = vscode.commands.registerCommand(
      'picowgo.extra.pins',
      function () {
        const panel = vscode.window.createWebviewPanel(
          'pins',
          'Pico W Pin Map',
          vscode.ViewColumn.Active,
          {
            // Only allow the webview to access resources in our extension's media directory
            localResourceRoots: [
              vscode.Uri.file(path.join(context.extensionPath, 'images')),
            ],
          }
        );

        const onDiskPath = vscode.Uri.file(
          path.join(context.extensionPath, 'images', 'Pico-W-Pins.svg')
        );
        const imageUrl = panel.webview.asWebviewUri(onDiskPath);
        panel.webview.html = pinmap(imageUrl.toString());
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.extra.getSerial',
      async function () {
        terminal?.show();
        await serialDolmatcher.getSerial();
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.reset.soft',
      async function () {
        terminal?.show();
        await serialDolmatcher.resetSoft();
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.reset.hard',
      async function () {
        terminal?.show();
        await serialDolmatcher.resetHard();
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.universalStop',
      async function () {
        if (v.stopAction !== undefined) {
          vscode.commands.executeCommand(v.stopAction);
        }
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picowgo.extra.firmwareUpdates',
      async function () {
        await serialDolmatcher.checkForFirmwareUpdates();
      }
    );
    context.subscriptions.push(disposable);

    return v;
  }

  private async checkPythonVersion(sw: SettingsWrapper) {
    let executables: string[] = [
      sw.get(SettingsKey.pythonPath) as string,
      'py.exe',
      'python3.exe',
      'python3',
      'python',
    ];

    for (let exe of executables) {
      if (exe !== undefined) {
        let result = await this.tryPython(exe);
        let match = /Python (?<major>[0-9]+)\.(?<minor>[0-9]+)\.[0-9]+/gm.exec(
          result
        );

        // minimum supported python version is 3.9
        if (
          match !== null &&
          typeof match?.groups?.major !== undefined &&
          parseInt(match?.groups?.major!) === 3 &&
          parseInt(match?.groups?.minor!) >= 9
        ) {
          sw.detectedPythonPath = exe;
          return;
        }
      }
    }
  }

  private tryPython(executable: string): Promise<string> {
    // not doing reject because it throws an error to parrent
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, reject): void => {
      try {
        // assigend to variable to avoid non blocking behaviour
        // eslint-disable-next-line no-unused-vars
        let ex = exec(`${executable} -V`, (error, stdout, stderr) => {
          if (error) {
            //console.debug("Err");
            // return reject(error?.message.toString());
            return resolve('');
          }

          if (stderr) {
            //console.debug("stdErr");
            // return reject(stderr.toString());
            return resolve('');
          }

          return resolve(stdout.toString());
        });
      } catch (err) {
        // return reject('failed');
        return resolve('');
      }
    });
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
    </body>
    </html>`;
  }
}

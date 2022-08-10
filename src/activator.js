'use babel';

import * as vscode from 'vscode';
import { exec } from 'child-process-promise';
import path from 'path';
import SettingsWrapper from './main/settings-wrapper';
import PanelView from './main/panel-view';
import Pymakr from './pymakr';
import Pyboard from './board/pyboard';
import StubsManager from './stubs/stubs-manager';

const pkg = vscode.extensions.getExtension('paulober.pico-w-go').packageJSON;

export default class Activator {
  async activate(context) {
    let _this = this;
    let sw = new SettingsWrapper();
    await sw.initialize(context.workspaceState);

    await this._checkPythonVersion(sw);

    if (sw.detectedPythonPath == undefined) {
      for(let item of pkg.contributes.commands) {
        let disposable = vscode.commands.registerCommand(item.command,
          function() {
            vscode.window.showErrorMessage('Pico-W-Go was unable to start, most likely because Python wasn\'t found on your machine.');
          });
        context.subscriptions.push(disposable);
      }

      let choice = await vscode.window.showErrorMessage(
        'Python3 is not detected on this machine so Pico-W-Go cannot work. Ensure it is in your PATH or set a python_path value in the Global Settings. Then restart VS Code.',
        null,
        'OK', 'Global Settings'
      );
      
      if (choice == 'Global Settings')
        await sw.api.openSettings();
      return;
    }

    let sm = new StubsManager();
    await sm.updateStubs();

    let pb = new Pyboard(sw);

    let v = new PanelView(pb, sw);
    await v.initialize();

    let pymakr = new Pymakr({}, pb, v, sw);

    let terminal = v.terminal;

    let disposable = vscode.commands.registerCommand('picowgo.help',
      function() {
        terminal.show();
        vscode.env.openExternal(vscode.Uri.parse(
          'http://pico-go.net/docs/start/quick/'));
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.listCommands',
      function() {
        v.showQuickPick();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.initialise',
      function() {
        sm.addToWorkspace();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.connect',
      async function() {
        terminal.show();
        await pymakr.connect();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.run',
      async function() {
        terminal.show();
        await pymakr.run();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.runselection',
      async function() {
        terminal.show();
        await pymakr.runSelection();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.upload', function() {
      terminal.show();
      pymakr.upload();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.uploadFile',
      function() {
        terminal.show();
        pymakr.uploadFile();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.download',
      async function() {
        terminal.show();
        await pymakr.download();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.deleteAllFiles',
      function() {
        terminal.show();

        setTimeout(async function() {
          await pymakr.deleteAllFiles();
        }, 500);
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.globalSettings',
      async function() {
        await pymakr.openGlobalSettings();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.disconnect',
      async function() {
        await pymakr.disconnect();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.toggleConnect',
      async function() {
        if (!pymakr.board.connected) {
          terminal.show();
        }
        await pymakr.toggleConnect();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.ftp',
      async function() {
        if (!pymakr.board.connected) {
          terminal.show();
        }
        await pymakr.toggleFtp();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.extra.pins',
      function() {
        const panel = vscode.window.createWebviewPanel(
          'pins',
          'Pico W Pin Map',
          vscode.ViewColumn.Active, {
            // Only allow the webview to access resources in our extension's media directory
            localResourceRoots: [vscode.Uri.file(path.join(context
              .extensionPath, 'images'))]
          }
        );

        const onDiskPath = vscode.Uri.file(
          path.join(context.extensionPath, 'images', 'Pico-W-Pins.svg')
        );
        const imageUrl = panel.webview.asWebviewUri(onDiskPath);

        panel.webview.html = _this._getPinMapHtml(imageUrl);
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'picogo.extra.getFullVersion', async function() {
        terminal.show();
        await pymakr.getFullVersion();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.extra.getSerial',
      async function() {
        terminal.show();
        await pymakr.getSerial();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.reset.soft',
      async function() {
        terminal.show();
        await pymakr.resetSoft();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.reset.hard',
      async function() {
        terminal.show();
        await pymakr.resetHard();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.universalStop',
      async function() {
        if (v.stopAction != undefined)
          vscode.commands.executeCommand(v.stopAction);
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picowgo.extra.firmwareUpdates',
      async function() {
        await pymakr.checkForFirmwareUpdates();
      });
    context.subscriptions.push(disposable);

    return v;
  }

  async _checkPythonVersion(sw) {
    let executables = [sw.python_path, 'py.exe', 'python3.exe', 'python3', 'python'];

    for(let executable of executables) {
      if (executable != undefined) {
        let result = await this._tryPython(executable);
        let match = /Python (?<major>[0-9]+)\.[0-9]+\.[0-9]+/gm.exec(result);

        if (match != undefined && parseInt(match.groups.major) >= 3){
          sw.detectedPythonPath = executable;
          return;
        }
      }
    }
  }

  async _tryPython(executable) {
    try {
      let result = await exec(`${executable} -V`);
      return result.stdout;
    }
    catch (err) {
      return "error";
    }
  }

  _getPinMapHtml(imageUrl) {
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
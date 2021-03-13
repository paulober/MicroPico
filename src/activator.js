'use babel';

import * as vscode from 'vscode';
import { exec } from 'child-process-promise';
import path from 'path';
import SettingsWrapper from './main/settings-wrapper';
import PanelView from './main/panel-view';
import Pymakr from './pymakr';
import Pyboard from './board/pyboard';
import StubsManager from './stubs/stubs-manager';

export default class Activator {
  async activate(context) {
    let _this = this;
    let sw = new SettingsWrapper();
    await sw.initialize();

    let pythonInstalled = await this._checkPythonVersion();

    if (!pythonInstalled) {
      vscode.window.showErrorMessage(
        'Python3 is not detected on this machine so Pico-Go cannot work. Ensure it is in your PATH.'
      );
      return;
    }

    let sm = new StubsManager();
    await sm.updateStubs();

    let pb = new Pyboard(sw);
    let v = new PanelView(pb, sw);
    let pymakr = new Pymakr({}, pb, v, sw);

    let terminal = v.terminal;

    let disposable = vscode.commands.registerCommand('picogo.help',
      function() {
        terminal.show();
        vscode.env.openExternal(vscode.Uri.parse(
          'http://pico-go.net/docs/start/quick/'));
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.listCommands',
      function() {
        v.showQuickPick();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.initialise',
      function() {
        sm.addToWorkspace();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.connect',
      async function() {
        terminal.show();
        await pymakr.connect();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.run',
      async function() {
        terminal.show();
        await pymakr.run();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.runselection',
      async function() {
        terminal.show();
        await pymakr.runSelection();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.upload', function() {
      terminal.show();
      pymakr.upload();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.uploadFile',
      function() {
        terminal.show();
        pymakr.uploadFile();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.download',
      async function() {
        terminal.show();
        await pymakr.download();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.deleteAllFiles',
      function() {
        terminal.show();

        setTimeout(async function() {
          await pymakr.deleteAllFiles();
        }, 500);
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.globalSettings',
      async function() {
        await pymakr.openGlobalSettings();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.disconnect',
      async function() {
        await pymakr.disconnect();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.toggleConnect',
      async function() {
        if (!pymakr.board.connected) {
          terminal.show();
        }
        await pymakr.toggleConnect();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.ftp',
    async function() {
      if (!pymakr.board.connected) {
        terminal.show();
      }
      await pymakr.toggleFtp();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.extra.pins',
      function() {
        const panel = vscode.window.createWebviewPanel(
          'pins',
          'Pico Pin Map',
          vscode.ViewColumn.One, {
            // Only allow the webview to access resources in our extension's media directory
            localResourceRoots: [vscode.Uri.file(path.join(context
              .extensionPath, 'images'))]
          }
        );

        const onDiskPath = vscode.Uri.file(
          path.join(context.extensionPath, 'images', 'Pico-Pins.png')
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

    disposable = vscode.commands.registerCommand('picogo.extra.getSerial',
      async function() {
        terminal.show();
        await pymakr.getSerial();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.reset.soft',
      async function() {
        terminal.show();
        await pymakr.resetSoft();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.reset.hard',
      async function() {
        terminal.show();
        await pymakr.resetHard();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('picogo.universalStop',
    async function() {
      if (v.stopAction != undefined)
        vscode.commands.executeCommand(v.stopAction);
    });
  context.subscriptions.push(disposable);

    return v;
  }

  async _checkPythonVersion() {
    try {
      let executable = process.platform == 'win32' ? 'py' : 'python3';
      let result = await exec(`${executable} -V`);
      let match = /Python (?<major>[0-9]+)\.[0-9]+\.[0-9]+/gm.exec(result.stdout);
  
      if (match == null)
        return false;
  
      let major = parseInt(match.groups.major);
      return major >= 3;
    }
    catch(err) {
      return false;
    }
  }

  _getPinMapHtml(imageUrl) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pico Pin Map</title>
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
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

    let nodeInstalled = await this._checkNodeVersion();

    if (!nodeInstalled) {
      vscode.window.showErrorMessage(
        'NodeJS not detected on this machine, which is required for Pico-Go to work.'
      );
      return;
    }

    let sm = new StubsManager();
    await sm.updateStubs();

    let pb = new Pyboard(sw);
    let v = new PanelView(pb, sw);
    let pymakr = new Pymakr({}, pb, v, sw);

    let terminal = v.terminal;

    let disposable = vscode.commands.registerCommand('pymakr.help',
      function() {
        terminal.show();
        vscode.env.openExternal(vscode.Uri.parse(
          'http://pico-go.net/docs/start/quick/'));
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.listCommands',
      function() {
        v.showQuickPick();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.initialise',
      function() {
        sm.addToWorkspace();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.connect',
      async function() {
        terminal.show();
        await pymakr.connect();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.run',
      async function() {
        terminal.show();
        await pymakr.run();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.runselection',
      async function() {
        terminal.show();
        await pymakr.runSelection();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.upload', function() {
      terminal.show();
      pymakr.upload();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.uploadFile',
      function() {
        terminal.show();
        pymakr.uploadFile();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.download',
      async function() {
        terminal.show();
        await pymakr.download();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.deleteAllFiles',
      function() {
        terminal.show();

        setTimeout(async function() {
          await pymakr.deleteAllFiles();
        }, 500);
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.globalSettings',
      async function() {
        await pymakr.openGlobalSettings();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.disconnect',
      async function() {
        await pymakr.disconnect();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.toggleConnect',
      async function() {
        if (!pymakr.board.connected) {
          terminal.show();
        }
        await pymakr.toggleConnect();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.extra.pins',
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
      'pymakr.extra.getFullVersion', async function() {
        terminal.show();
        await pymakr.getFullVersion();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.extra.getSerial',
      async function() {
        terminal.show();
        await pymakr.getSerial();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.reset.soft',
      async function() {
        terminal.show();
        await pymakr.resetSoft();
      });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('pymakr.reset.hard',
      async function() {
        terminal.show();
        await pymakr.resetHard();
      });
    context.subscriptions.push(disposable);

    return v;
  }

  async _checkNodeVersion() {
    let result = await exec('node -v');
    return result.stdout.substr(0, 1) == 'v';
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
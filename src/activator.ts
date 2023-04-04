import * as vscode from 'vscode';

const pkg = vscode.extensions.getExtension('paulober.pico-w-go')?.packageJSON;

export default class Activator {
  public async activate(context: vscode.ExtensionContext) {
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

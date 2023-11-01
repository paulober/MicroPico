import { readFileSync } from "fs";
import {
  type CancellationToken,
  Uri,
  type WebviewView,
  type WebviewViewProvider,
  type WebviewViewResolveContext,
} from "vscode";
import type { Terminal } from "./terminal.mjs";
import { join } from "path";

export default class Panel implements WebviewViewProvider {
  private readonly _extensionUri: Uri;
  private _view?: WebviewView;
  private _terminal?: Terminal;

  public static readonly viewId = "micropico.vrepl-panel";

  constructor(extensionUri: Uri, terminal: Terminal) {
    this._extensionUri = extensionUri;
    this._terminal = terminal;
  }

  public resolveWebviewView(
    webviewView: WebviewView,
    context: WebviewViewResolveContext<unknown>,
    token: CancellationToken
  ): void {
    this._view = webviewView;

    this._view.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [
        Uri.file(Uri.joinPath(this._extensionUri, "panel").fsPath),
      ],
    };
    console.log(this._view.webview.options.localResourceRoots);

    this._view.webview.html = this._getHtmlForWebview();

    this._view.webview.onDidReceiveMessage(
      (data: { type: string; content: string }) => {
        switch (data.type) {
          case "commandSubmit": {
            this._terminal?.handleInput(data.content);
            this._terminal?.handleInput("\r\n");
            break;
          }
          case "keyup": {
            this._terminal?.handleInput(data.content);
            break;
          }
        }
      }
    );

    // TODO: disposable
    this._terminal?.onDidWrite((e: string) => {
      if (this._view) {
        this._view.show?.(true);
        void this._view.webview.postMessage({ type: "input", data: e });
      }
    });
  }

  private _getHtmlForWebview(): string {
    const htmlUri = this._view?.webview.asWebviewUri(
      Uri.file(Uri.joinPath(this._extensionUri, "panel", "index.html").fsPath)
    );
    const xtermCssUri = this._view?.webview.asWebviewUri(
      Uri.file(
        Uri.joinPath(this._extensionUri, "panel", "xterm", "css", "xterm.css")
          .fsPath
      )
    );
    const xtermJsUri = this._view?.webview.asWebviewUri(
      Uri.file(
        Uri.joinPath(this._extensionUri, "panel", "xterm", "lib", "xterm.js")
          .fsPath
      )
    );
    const styleCssUri = this._view?.webview.asWebviewUri(
      Uri.file(Uri.joinPath(this._extensionUri, "panel", "style.css").fsPath)
    );
    const mainJsUri = this._view?.webview.asWebviewUri(
      Uri.file(Uri.joinPath(this._extensionUri, "panel", "main.js").fsPath)
    );

    if (
      htmlUri === undefined ||
      xtermCssUri === undefined ||
      xtermJsUri === undefined ||
      styleCssUri === undefined ||
      mainJsUri === undefined
    ) {
      return "";
    }
    const htmlPath = htmlUri?.path;

    let html = readFileSync(htmlPath, { encoding: "utf-8" });
    html = html
      .replaceAll("${nonce}", this._getNonce())
      .replaceAll("${xtermCSS}", xtermCssUri.toString())
      .replaceAll("${xtermJS}", xtermJsUri.toString())
      .replaceAll("${styleCSS}", styleCssUri.toString())
      .replaceAll("${mainJS}", mainJsUri.toString())
      .replaceAll("${webview.cspSource}", this._view?.webview.cspSource ?? "");
    console.log(xtermJsUri.toString());

    return html;
  }

  private _getNonce(): string {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }
}

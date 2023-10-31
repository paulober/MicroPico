import { readFileSync } from "fs";
import {
  type CancellationToken,
  Uri,
  type WebviewView,
  type WebviewViewProvider,
  type WebviewViewResolveContext,
  window,
} from "vscode";
import type { Terminal } from "./terminal.mjs";

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

      localResourceRoots: [this._extensionUri],
    };

    this._view.webview.html = this._getHtmlForWebview();

    webviewView.webview.onDidReceiveMessage(
      (data: { type: string; content: string }) => {
        switch (data.type) {
          case "commandSubmit": {
            this._terminal?.handleInput(data.content);
            this._terminal?.handleInput("\n");
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
      Uri.joinPath(this._extensionUri, "panel", "index.html")
    );

    if (htmlUri === undefined) {
      return "";
    }
    const htmlPath = htmlUri?.path;

    return readFileSync(htmlPath, { encoding: "utf-8" });
  }
}

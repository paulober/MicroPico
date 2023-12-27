/* eslint-disable max-len */
import {
  type PyOutCommandWithResponse,
  PyOutType,
  type PyboardRunner,
} from "@paulober/pyboard-serial-com";
import {
  Uri,
  window,
  type Webview,
  type WebviewView,
  type WebviewViewProvider,
} from "vscode";

const INSTALLED_PACKAGES_SCRIPT = `
from uos import listdir as __pico_listdir
from ujson import dumps as __pico_dumps
try:
    print(__pico_dumps(__pico_listdir('/lib')))
except OSError:
    print(__pico_dumps([]))
del __pico_dumps
del __pico_listdir
`;

// TODO: may also check if the library no exists in /lib
const INSTALL_PACKAGE_SCRIPT = (pkg: string): string => `
from mip import install as __pico_install
__pico_install('${pkg}')
del __pico_install
`;

interface WebviewMessage {
  command: string;
  data: string;
}

export default class PackagesWebviewProvider implements WebviewViewProvider {
  public static readonly viewType = "micropico-device-packages";

  private _view?: WebviewView;
  private _isDisabled = true;

  constructor(
    private readonly pyb: PyboardRunner,
    private readonly _extensionUri: Uri
  ) {}

  public async disable(): Promise<void> {
    this._isDisabled = true;
    // TODO: switch to messages so we didn't need to reload the hole webview
    if (this._view) {
      await this._refreshHTML(this._view);
    }
  }

  public async enable(): Promise<void> {
    this._isDisabled = false;
    // TODO: switch to messages so we didn't need to reload the hole webview
    if (this._view) {
      await this._refreshHTML(this._view);
    }
  }

  private async _getInstalledPackages(): Promise<string[]> {
    const installedPackages = await this.pyb.executeCommand(
      INSTALLED_PACKAGES_SCRIPT
    );

    if (installedPackages.type === PyOutType.commandWithResponse) {
      return (
        (JSON.parse(
          (installedPackages as PyOutCommandWithResponse).response.trimEnd()
        ) as string[]) ?? []
      );
    }

    return [];
  }

  private async installPackage(pkg: string): Promise<void> {
    const installPackageResult = await this.pyb.executeCommand(
      INSTALL_PACKAGE_SCRIPT(pkg)
    );

    if (installPackageResult.type === PyOutType.commandWithResponse) {
      const response = (installPackageResult as PyOutCommandWithResponse)
        .response;

      if (!response.toLowerCase().includes("not found")) {
        void window.showInformationMessage(
          "[mip] Package installed successfully."
        );
        // send message installed successfully to webview for packages list
        if (this._view) {
          void this._view.webview.postMessage({
            command: "packageInstalled",
            data: pkg,
          } as WebviewMessage);
        }
      } else {
        await window.showErrorMessage(
          "[mip] Package not found or failed to install."
        );
      }
    }
  }

  public async resolveWebviewView(webviewView: WebviewView): Promise<void> {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      switch (message.command) {
        case "installPackage":
          await this.installPackage(message.data);
          break;
        default:
          break;
      }
    });
    await this._refreshHTML(webviewView);
  }

  private async _refreshHTML(webviewView: WebviewView): Promise<void> {
    webviewView.webview.html = await this._getHtmlForWebview(
      webviewView.webview
    );
  }

  private async _getHtmlForWebview(webview: Webview): Promise<string> {
    const mainScriptUri = webview.asWebviewUri(
      Uri.joinPath(this._extensionUri, "web", "main.js")
    );

    const mainStyleUri = webview.asWebviewUri(
      Uri.joinPath(this._extensionUri, "web", "main.css")
    );

    const installedPackages = await this._getInstalledPackages();

    // Restrict the webview to only load specific scripts
    const nonce = getNonce();

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Device Packages</title>

        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${
          webview.cspSource
        } 'unsafe-inline'; img-src ${
      webview.cspSource
    } https:; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${mainStyleUri.toString()}" rel="stylesheet"></style>
      </head>
      <body>
        <div style="width: 100%;" class="input-div">
          ${
            this._isDisabled
              ? "<p>Your Pico must be connected to Wifi for this feature to work</p>"
              : `
          <input type="text" id="packageInput" placeholder="mip package" style=""/>
          <button id="installButton"><strong>Install</strong></button>`
          }
          
        </div>
        <div style="width: 100%;">
          <p><strong>Installed packages:</strong></p>
          <ul id="installedPackagesList" ${this._isDisabled ? "disabled" : ""}>
          ${installedPackages.map(p => `<li>${p}</li>`).join("")}
          </ul>
        </div>

        <script nonce="${nonce}" src="${mainScriptUri.toString()}"></script>
      </body>
      </html>
    `;
  }
}

function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

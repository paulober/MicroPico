import {
  Uri,
  window,
  workspace,
  type Webview,
  type WebviewView,
  type WebviewViewProvider,
} from "vscode";

/** View id contributed in package.json. */
export const PLOTTER_VIEW_ID = "micropico-plotter";

interface WebviewMessage {
  command: "ready" | "clear" | "exportCsv" | "exportPng";
  dataUrl?: string;
}

/**
 * Webview view (Panel area, next to the vREPL terminal) that renders a live
 * plot of the numeric data printed by the running MicroPython program.
 *
 * The provider owns the collected data (for CSV export) and forwards samples
 * to the webview, which draws them with uPlot. See MicroPico #258.
 */
export default class PlotterViewProvider implements WebviewViewProvider {
  private view?: WebviewView;
  private labels: string[] = [];
  private readonly samples: number[][] = [];

  constructor(private readonly extensionUri: Uri) {}

  public resolveWebviewView(webviewView: WebviewView): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [Uri.joinPath(this.extensionUri, "web", "plotter")],
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
      switch (message.command) {
        case "ready":
          this.replay();
          break;
        case "clear":
          this.clear();
          break;
        case "exportCsv":
          void this.exportCsv();
          break;
        case "exportPng":
          if (message.dataUrl) {
            void this.exportPng(message.dataUrl);
          }
          break;
      }
    });

    webviewView.onDidDispose(() => {
      if (this.view === webviewView) {
        this.view = undefined;
      }
    });
  }

  /** Whether the plotter view is currently open and visible. */
  public isVisible(): boolean {
    return this.view?.visible ?? false;
  }

  /** Set the series labels (from a header line). */
  public setLabels(labels: string[]): void {
    this.labels = labels;
    void this.view?.webview.postMessage({ command: "labels", labels });
  }

  /** Append one data sample (one value per series). */
  public addSample(values: number[]): void {
    this.samples.push(values);
    void this.view?.webview.postMessage({ command: "sample", values });
  }

  /** Clear all collected data and the chart. */
  public clear(): void {
    this.samples.length = 0;
    void this.view?.webview.postMessage({ command: "clear" });
  }

  /** Re-send the current state to a (re)loaded webview. */
  private replay(): void {
    if (this.labels.length > 0) {
      void this.view?.webview.postMessage({
        command: "labels",
        labels: this.labels,
      });
    }
    void this.view?.webview.postMessage({
      command: "bulk",
      samples: this.samples,
    });
  }

  private async exportCsv(): Promise<void> {
    if (this.samples.length === 0) {
      void window.showInformationMessage("No plot data to export yet.");

      return;
    }

    const columns = this.samples[0].length;
    const header =
      this.labels.length === columns
        ? this.labels
        : Array.from({ length: columns }, (_v, i) => `series_${i + 1}`);
    const rows = this.samples.map(sample => sample.join(","));
    const csv = [header.join(","), ...rows].join("\n") + "\n";

    const target = await window.showSaveDialog({
      saveLabel: "Export plot data",
      filters: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "CSV files": ["csv"],
      },
    });
    if (target) {
      await workspace.fs.writeFile(target, Buffer.from(csv, "utf-8"));
    }
  }

  private async exportPng(dataUrl: string): Promise<void> {
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    const target = await window.showSaveDialog({
      saveLabel: "Export plot image",
      filters: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "PNG images": ["png"],
      },
    });
    if (target) {
      await workspace.fs.writeFile(target, Buffer.from(base64, "base64"));
    }
  }

  private getHtml(webview: Webview): string {
    const base = Uri.joinPath(this.extensionUri, "web", "plotter");
    const scriptUri = webview.asWebviewUri(Uri.joinPath(base, "plotter.js"));
    const uplotJsUri = webview.asWebviewUri(
      Uri.joinPath(base, "uPlot.iife.min.js")
    );
    const uplotCssUri = webview.asWebviewUri(
      Uri.joinPath(base, "uPlot.min.css")
    );
    const styleUri = webview.asWebviewUri(Uri.joinPath(base, "plotter.css"));
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src ${webview.cspSource} blob: data:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="${uplotCssUri.toString()}" rel="stylesheet" />
    <link href="${styleUri.toString()}" rel="stylesheet" />
    <title>MicroPico Plotter</title>
  </head>
  <body>
    <div class="toolbar">
      <button id="pause" title="Pause / resume">Pause</button>
      <button id="clear" title="Clear the plot">Clear</button>
      <button id="csv" title="Export data as CSV">Export CSV</button>
      <button id="png" title="Export chart as PNG">Export PNG</button>
    </div>
    <div id="chart"></div>
    <script nonce="${nonce}" src="${uplotJsUri.toString()}"></script>
    <script nonce="${nonce}" src="${scriptUri.toString()}"></script>
  </body>
</html>`;
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

import * as vscode from "vscode";
import { appendFileSync } from "fs";
import Logger from "../logger.mjs";
import { commandPrefix } from "../api.mjs";
import { PlotParser } from "../plotter/plotParser.mjs";

/**
 * The subset of the plotter view the router feeds. Kept minimal so the routing
 * logic can be unit-tested with a fake sink instead of a real webview.
 */
export interface PlotterSink {
  isVisible(): boolean;
  setLabels(labels: string[]): void;
  addSample(values: number[]): void;
}

/** Appends a chunk of board output to a file. Injectable for testing. */
export type AppendFn = (path: string, data: Buffer) => void;

/**
 * Routes board output to the live plotter and, when enabled for the session, to
 * a user-selected file. Owns the redirect target and the plot parser so the
 * rest of the extension only needs to hand it raw output via {@link route}.
 */
export class OutputRouter {
  private target?: string;
  private readonly parser = new PlotParser();
  private skippedOutput = false;
  private readonly logger = new Logger("OutputRouter");

  constructor(
    private readonly plotter: PlotterSink,
    private readonly append: AppendFn = appendFileSync,
  ) {}

  /**
   * Route a chunk of board output: always offered to the plotter (which ignores
   * it unless visible and numeric) and appended to the redirect file if set.
   */
  public route(data: Buffer): void {
    this.feedPlotter(data);

    if (this.target === undefined) {
      return;
    }

    try {
      this.append(this.target, data);
    } catch (error) {
      this.logger.error(
        `Failed to redirect output to file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** Whether the plotter view is open and visible. */
  public isPlotterVisible(): boolean {
    return this.plotter.isVisible();
  }

  /** The current redirect target, or undefined when redirection is disabled. */
  public getTarget(): string | undefined {
    return this.target;
  }

  /**
   * Feeds board output to the live plotter while its view is open. Non-numeric
   * output is ignored by the parser, so normal prints are unaffected.
   */
  private feedPlotter(data: Buffer): void {
    if (!this.plotter.isVisible()) {
      this.skippedOutput = true;

      return;
    }

    if (this.skippedOutput) {
      // a partial line from before the gap would merge with unrelated output
      this.parser.reset();
      this.skippedOutput = false;
    }

    for (const event of this.parser.push(data.toString("utf-8"))) {
      if (event.type === "labels") {
        this.plotter.setLabels(event.labels);
      } else {
        this.plotter.addSample(event.values);
      }
    }
  }

  /** Registers the "redirect output" command that manages the target. */
  public registerRedirectCommand(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        commandPrefix + "redirectOutput",
        () => this.promptForRedirect(),
      ),
    );
  }

  /** Prompt the user to disable, inspect or pick a file for output redirection. */
  public async promptForRedirect(): Promise<void> {
    const disable = `$(x) ${vscode.l10n.t("Disable")}`;
    const status = `$(info) ${vscode.l10n.t("Status")}`;
    const toFile = `$(arrow-right) ${vscode.l10n.t("File")}`;
    const location = await vscode.window.showQuickPick(
      [disable, status, toFile],
      {
        canPickMany: false,
        placeHolder: vscode.l10n.t(
          "Select the output location or manage settings",
        ),
        title: vscode.l10n.t("Output redirection for this session"),
        ignoreFocusOut: false,
      },
    );

    switch (location) {
      case disable:
        this.target = undefined;
        break;
      case status:
        void vscode.window.showInformationMessage(
          this.target
            ? vscode.l10n.t("Output is redirected to: {0}", this.target)
            : vscode.l10n.t("Output redirection is disabled"),
        );
        break;
      case toFile: {
        const file = await vscode.window.showSaveDialog({
          filters: {
            [vscode.l10n.t("Text files")]: ["txt"],
            [vscode.l10n.t("Log files")]: ["log"],
            [vscode.l10n.t("All files")]: ["*"],
          },
          saveLabel: vscode.l10n.t("Save output to file"),
        });

        if (file) {
          this.target = file.fsPath;
        }
        break;
      }
    }
  }
}

import * as vscode from "vscode";
import { l10n } from "vscode";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { Command } from "./command.mjs";

/** Downloads the whole board filesystem into the sync folder. */
export class DownloadCommand extends Command {
  public readonly id = "download";

  public async execute(): Promise<void> {
    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage(
        l10n.t("Please connect to the board first."),
      );

      return;
    }

    this.ctx.settings.reload();

    const syncDir = await this.ctx.settings.requestSyncFolder("Download");
    if (syncDir === undefined) {
      void vscode.window.showWarningMessage(
        l10n.t("Download canceled. No sync folder selected."),
      );

      return;
    }

    if (await this.ctx.checkForRunningOperation("Download")) {
      return;
    }

    void vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: l10n.t("Downloading"),
        cancellable: false,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => this.ctx.com.interruptExecution());

        // only balance the user-operation counter if the transfer started
        let started = false;
        const data = await this.ctx.com.downloadProject(
          syncDir[1],
          "/",
          undefined,
          undefined,
          (
            totalChunksCount: number,
            currentChunk: number,
            relativePath: string,
          ) => {
            if (currentChunk === 1) {
              started = true;
              this.ctx.ui?.userOperationStarted();
            }
            progress.report({
              increment: 100 / totalChunksCount,
              message:
                totalChunksCount === currentChunk
                  ? l10n.t("Project downloaded")
                  : relativePath,
            });
          },
        );
        if (started) {
          this.ctx.ui?.userOperationStopped();
        }
        if (data?.type === OperationResultType.commandResult) {
          if (data.result) {
            void vscode.window.showInformationMessage(
              l10n.t("Project downloaded."),
            );
          } else {
            void vscode.window.showErrorMessage(
              l10n.t("Project download failed."),
            );
          }
        }
      },
    );
  }
}

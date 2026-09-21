import * as vscode from "vscode";
import { l10n } from "vscode";
import { basename, join } from "path";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { getFocusedFile } from "../api.mjs";
import { Command } from "./command.mjs";

/** Downloads a single board file into the sync folder. */
export class DownloadFileCommand extends Command {
  public readonly id = "downloadFile";

  public async execute(...args: unknown[]): Promise<void> {
    const resourceURI = args[0] as vscode.Uri | undefined;

    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage(
        l10n.t("Please connect to the board first."),
      );

      return;
    }

    const syncDir = await this.ctx.settings.requestSyncFolder("Download");
    if (syncDir === undefined) {
      void vscode.window.showWarningMessage(
        l10n.t("Download canceled. No sync folder selected."),
      );

      return;
    }

    const file =
      resourceURI?.fsPath.replaceAll("\\", "/") ??
      (await getFocusedFile())?.replaceAll("\\", "/");

    if (file === undefined) {
      void vscode.window.showWarningMessage(l10n.t("No file open."));

      return;
    }

    if (await this.ctx.checkForRunningOperation("Download")) {
      return;
    }

    void vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: l10n.t("Downloading file"),
        cancellable: false,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => this.ctx.com.interruptExecution());

        // only balance the user-operation counter if the transfer started
        let started = false;
        const data = await this.ctx.com.downloadFiles(
          [file],
          join(syncDir[1], basename(file)),
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
                  ? l10n.t("Downloaded")
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
              l10n.t("{0} was downloaded successfully.", file),
            );
          } else {
            void vscode.window.showErrorMessage(
              l10n.t("File download failed."),
            );
          }
        }
      },
    );
  }
}

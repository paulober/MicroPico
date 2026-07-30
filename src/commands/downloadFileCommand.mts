import * as vscode from "vscode";
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
        "Please connect to the Pico first.",
      );

      return;
    }

    const syncDir = await this.ctx.settings.requestSyncFolder("Download");
    if (syncDir === undefined) {
      void vscode.window.showWarningMessage(
        "Download canceled. No sync folder selected.",
      );

      return;
    }

    const file =
      resourceURI?.fsPath.replaceAll("\\", "/") ??
      (await getFocusedFile())?.replaceAll("\\", "/");

    if (file === undefined) {
      void vscode.window.showWarningMessage("No file open.");

      return;
    }

    void vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Downloading file",
        cancellable: false,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => this.ctx.com.interruptExecution());

        const data = await this.ctx.com.downloadFiles(
          [file],
          join(syncDir[1], basename(file)),
          (
            totalChunksCount: number,
            currentChunk: number,
            relativePath: string,
          ) => {
            if (currentChunk === 1) {
              this.ctx.ui?.userOperationStarted();
            }
            progress.report({
              increment: 100 / totalChunksCount,
              message:
                totalChunksCount === currentChunk ? "Downloaded" : relativePath,
            });
          },
        );
        this.ctx.ui?.userOperationStopped();
        if (data?.type === OperationResultType.commandResult) {
          if (data.result) {
            void vscode.window.showInformationMessage(
              `${file} was downloaded successfully.`,
            );
          } else {
            void vscode.window.showErrorMessage("File download failed.");
          }
        }
      },
    );
  }
}

import * as vscode from "vscode";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { Command } from "./command.mjs";

/** Downloads the whole board filesystem into the sync folder. */
export class DownloadCommand extends Command {
  public readonly id = "download";

  public async execute(): Promise<void> {
    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage(
        "Please connect to the Pico first.",
      );

      return;
    }

    this.ctx.settings.reload();

    const syncDir = await this.ctx.settings.requestSyncFolder("Download");
    if (syncDir === undefined) {
      void vscode.window.showWarningMessage(
        "Download canceled. No sync folder selected.",
      );

      return;
    }

    void vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Downloading",
        cancellable: false,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => this.ctx.com.interruptExecution());

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
              this.ctx.ui?.userOperationStarted();
            }
            progress.report({
              increment: 100 / totalChunksCount,
              message:
                totalChunksCount === currentChunk
                  ? "Project downloaded"
                  : relativePath,
            });
          },
        );
        this.ctx.ui?.userOperationStopped();
        if (data?.type === OperationResultType.commandResult) {
          if (data.result) {
            void vscode.window.showInformationMessage("Project downloaded.");
          } else {
            void vscode.window.showErrorMessage("Project download failed.");
          }
        }
      },
    );
  }
}

import * as vscode from "vscode";
import { basename } from "path";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { commandPrefix, getFocusedFile } from "../api.mjs";
import { SettingsKey } from "../settings.mjs";
import { Command } from "./command.mjs";

/** Uploads a single local file to the board root. */
export class UploadFileCommand extends Command {
  public readonly id = "uploadFile";

  public async execute(...args: unknown[]): Promise<void> {
    const resourceURI = args[0] as vscode.Uri | undefined;

    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage(
        "Please connect to the Pico first.",
      );

      return;
    }

    const file = resourceURI?.fsPath ?? (await getFocusedFile());
    if (file === undefined) {
      void vscode.window.showWarningMessage("No file open.");

      return;
    }

    if (this.ctx.settings.getBoolean(SettingsKey.gcBeforeUpload)) {
      await this.ctx.com.runCommand(
        "import gc as __pe_gc; __pe_gc.collect(); del __pe_gc",
      );
    }

    void vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Uploading file",
        cancellable: false,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => this.ctx.com.interruptExecution());

        const data = await this.ctx.com.uploadFiles(
          [file],
          "/",
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
                totalChunksCount === currentChunk ? "Uploaded" : relativePath,
            });
          },
        );
        this.ctx.ui?.userOperationStopped();
        if (data?.type === OperationResultType.commandResult) {
          if (data.result) {
            this.ctx.picoFs?.fileChanged(
              vscode.FileChangeType.Created,
              vscode.Uri.from({ scheme: "pico", path: "/" + basename(file) }),
            );
            void vscode.window.showInformationMessage(
              `${file} was uploaded successfully.`,
            );
            if (
              this.ctx.settings.getBoolean(SettingsKey.softResetAfterUpload)
            ) {
              await vscode.commands.executeCommand(
                commandPrefix + "reset.soft.listen",
              );
            }
          } else {
            void vscode.window.showErrorMessage("File upload failed.");
          }
        }
      },
    );
  }
}

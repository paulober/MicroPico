import * as vscode from "vscode";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { commandPrefix } from "../api.mjs";
import { SettingsKey } from "../settings.mjs";
import { resolveIgnoredSyncItems } from "../utils/syncIgnore.mjs";
import Logger from "../logger.mjs";
import { Command } from "./command.mjs";

/** Uploads the project's sync folder to the board. */
export class UploadCommand extends Command {
  public readonly id = "upload";

  private readonly logger = new Logger("UploadCommand");

  public async execute(): Promise<void> {
    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage(
        "Please connect to the Pico first.",
      );

      return;
    }

    this.ctx.settings.reload();

    const syncDir = await this.ctx.settings.requestSyncFolder("Upload");
    if (syncDir === undefined) {
      void vscode.window.showWarningMessage(
        "Upload canceled. No sync folder selected.",
      );

      return;
    }

    const ignoredSyncItems = resolveIgnoredSyncItems(
      this.ctx.settings.getIngoredSyncItems(),
      syncDir[0],
    );

    if (this.ctx.settings.getBoolean(SettingsKey.gcBeforeUpload)) {
      // TODO: maybe do soft reboot instead of gc for bigger impact
      await this.ctx.com.runCommand(
        "import gc as __pe_gc; __pe_gc.collect(); del __pe_gc",
      );
    }

    void vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Uploading project",
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => this.ctx.com.interruptExecution());

        const data = await this.ctx.com.uploadProject(
          syncDir[1],
          this.ctx.settings.getSyncFileTypes(),
          ignoredSyncItems,
          (
            totalChunksCount: number,
            currentChunk: number,
            relativePath: string,
          ) => {
            if (currentChunk === 1) {
              this.ctx.ui?.userOperationStarted();
            }
            this.logger.debug(
              "upload progress: " +
                `${currentChunk}/${totalChunksCount} - ${relativePath}`,
            );

            progress.report({
              increment: 100 / totalChunksCount,
              message: relativePath,
            });
          },
        );
        this.ctx.ui?.userOperationStopped();

        if (data === undefined) {
          return;
        }

        if (data.type === OperationResultType.commandResult) {
          if (data.result) {
            void vscode.window.showInformationMessage("Project uploaded.");
          } else {
            void vscode.window.showErrorMessage("Project upload failed.");

            return;
          }
        }

        if (this.ctx.settings.getBoolean(SettingsKey.softResetAfterUpload)) {
          await vscode.commands.executeCommand(
            commandPrefix + "reset.soft.listen",
          );
        }
      },
    );
  }
}

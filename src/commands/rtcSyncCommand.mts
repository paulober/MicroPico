import * as vscode from "vscode";
import { l10n } from "vscode";
import { OperationResultType } from "@paulober/pico-mpy-com";
import { Command } from "./command.mjs";

/** Synchronizes the board's RTC with the host clock. */
export class RtcSyncCommand extends Command {
  public readonly id = "rtc.sync";

  public async execute(): Promise<void> {
    if (this.ctx.com.isPortDisconnected()) {
      void vscode.window.showWarningMessage(l10n.t("Please connect to the board first."));

      return;
    }

    const result = await this.ctx.com.syncRtcTime();
    if (result.type === OperationResultType.commandResult) {
      if (result.result) {
        void vscode.window.showInformationMessage(l10n.t("RTC synchronized"));
      } else {
        void vscode.window.showErrorMessage(l10n.t("RTC synchronization failed"));
      }
    }
  }
}

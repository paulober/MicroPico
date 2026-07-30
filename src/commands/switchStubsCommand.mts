import * as vscode from "vscode";
import {
  displayStringToStubPort,
  fetchAvailableStubsVersions,
  installIncludedStubs,
  installStubsByVersion,
  STUB_PORTS,
  stubPortToDisplayString,
} from "../stubs.mjs";
import {
  buildStubVersionOptions,
  parseStubVersionSelection,
} from "../utils/stubVersionOptions.mjs";
import { Command } from "./command.mjs";

/** Lets the user pick a stub port + version and installs the matching stubs. */
export class SwitchStubsCommand extends Command {
  public readonly id = "extra.switchStubs";

  public async execute(): Promise<void> {
    const stubPort = await vscode.window.showQuickPick(
      ["Included", ...STUB_PORTS.map(stubPortToDisplayString)],
      {
        canPickMany: false,
        placeHolder: "Select the stubs port you want to use",
        ignoreFocusOut: false,
      },
    );

    if (stubPort === undefined) {
      return;
    }

    if (stubPort.toLowerCase() === "included") {
      await installIncludedStubs(this.ctx.settings);
      void vscode.window.showInformationMessage("Included stubs selected.");

      return;
    }

    const availableStubVersions = await fetchAvailableStubsVersions(stubPort);
    const versions = buildStubVersionOptions(
      availableStubVersions,
      stubPortToDisplayString,
    );

    const version = await vscode.window.showQuickPick(versions, {
      canPickMany: false,
      placeHolder: "Select the stubs version you want to use",
      ignoreFocusOut: false,
    });

    if (version === undefined) {
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Downloading stubs, this may take a while...",
        cancellable: false,
      },
      async progress => {
        const { port, version: selectedVersion } = parseStubVersionSelection(
          version,
          availableStubVersions,
          displayStringToStubPort,
        );

        const result = await installStubsByVersion(
          selectedVersion,
          port,
          this.ctx.settings,
          this.ctx.pythonPath,
        );

        if (result) {
          progress.report({ increment: 100, message: "Stubs installed." });
          void vscode.window.showInformationMessage("Stubs installed.");
        } else {
          void vscode.window.showErrorMessage("Stubs installation failed.");
        }
      },
    );
  }
}

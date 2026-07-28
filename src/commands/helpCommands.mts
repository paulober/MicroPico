import * as vscode from "vscode";
import { join } from "path";
import { PicoMpyCom } from "@paulober/pico-mpy-com";
import { commandPrefix, writeIntoClipboard } from "../api.mjs";
import type UI from "../ui.mjs";
import type Settings from "../settings.mjs";
import { flashPicoInteractively } from "../flash.mjs";
import {
  getPinMapHtml,
  PICO_VARIANTS,
  PICO_VARAINTS_PINOUTS,
} from "../utils/pinMap.mjs";

/**
 * Dependencies required by the informational/utility ("help & extras") commands.
 *
 * Kept intentionally minimal and explicit - these leaf commands do not touch
 * the vREPL terminal or the command-executing flag.
 */
export interface HelpCommandDeps {
  ui?: UI;
  settings?: Settings;
}

/**
 * Registers the informational/utility commands (help, list commands, pin map,
 * list serial ports, firmware updates and flash Pico) and pushes each
 * disposable onto the extension's subscriptions.
 *
 * @param context The extension context used to register the commands.
 * @param deps The minimal set of dependencies the handlers require.
 */
export function registerHelpCommands(
  context: vscode.ExtensionContext,
  deps: HelpCommandDeps,
): void {
  // [Command] help
  let disposable = vscode.commands.registerCommand(
    commandPrefix + "help",
    function () {
      void vscode.env.openExternal(
        vscode.Uri.parse(
          "https://github.com/paulober/MicroPico/blob/main/README.md",
        ),
      );
    },
  );
  context.subscriptions.push(disposable);

  // [Command] List Commands
  disposable = vscode.commands.registerCommand(
    commandPrefix + "listCommands",
    () => {
      deps.ui?.showQuickPick();
    },
  );
  context.subscriptions.push(disposable);

  // [Command] Open pin map
  disposable = vscode.commands.registerCommand(
    commandPrefix + "extra.pins",
    async () => {
      const picoVariant = await vscode.window.showQuickPick(PICO_VARIANTS, {
        canPickMany: false,
        placeHolder: "Select your Pico variant",
        ignoreFocusOut: false,
      });

      const variantIdx = PICO_VARIANTS.indexOf(picoVariant ?? "");
      if (variantIdx < 0) {
        return;
      }

      const panel = vscode.window.createWebviewPanel(
        commandPrefix + "pinoout",
        `${PICO_VARIANTS[variantIdx]} Pinout`,
        vscode.ViewColumn.Active,
        {
          enableScripts: false,
          // Only allow the webview to access resources in our extension's media directory
          localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, "images"),
          ],
        },
      );

      panel.webview.html = getPinMapHtml(
        PICO_VARIANTS[variantIdx],
        panel.webview
          .asWebviewUri(
            vscode.Uri.file(
              join(
                context.extensionPath,
                "images",
                PICO_VARAINTS_PINOUTS[variantIdx],
              ),
            ),
          )
          .toString(),
      );
    },
  );
  context.subscriptions.push(disposable);

  // [Command] List all serial ports a Pico is connected to
  disposable = vscode.commands.registerCommand(
    commandPrefix + "extra.getSerial",
    async () => {
      const customVidPidPairs = deps.settings?.getCustomVidPidPairs();
      const ports = await PicoMpyCom.getSerialPorts(customVidPidPairs);
      if (ports.length > 1) {
        // TODO: maybe replace with quick pick in the future
        void vscode.window.showInformationMessage(
          "Found: " + ports.join(", "),
        );
      } else if (ports.length === 1) {
        writeIntoClipboard(ports[0]);
        void vscode.window.showInformationMessage(
          `Found: ${ports[0]} (copied to clipboard).`,
        );
      } else {
        void vscode.window.showWarningMessage("No connected Pico found.");
      }
    },
  );
  context.subscriptions.push(disposable);

  // [Command] Check for firmware updates
  disposable = vscode.commands.registerCommand(
    commandPrefix + "extra.firmwareUpdates",
    () => {
      void vscode.env.openExternal(
        vscode.Uri.parse("https://micropython.org/download/"),
      );
    },
  );
  context.subscriptions.push(disposable);

  // [Command] Flash Pico in BOOTSEL mode
  disposable = vscode.commands.registerCommand(
    commandPrefix + "flashPico",
    async () => {
      const result = await vscode.window.showInformationMessage(
        "This will flash the latest MicroPython firmware to your Pico. " +
          "Do you want to continue?",
        {
          modal: true,
          detail:
            "Note: Only Raspberry Pi Pico boards are supported. " +
            "Make sure it is connected and in BOOTSEL mode. " +
            "You can verify this by checking if a drive " +
            "labeled RPI-RP2 or RP2350 is mounted.",
        },
      );

      if (result === undefined) {
        return;
      }

      await flashPicoInteractively(true);
    },
  );
  context.subscriptions.push(disposable);
}

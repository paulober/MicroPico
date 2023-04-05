import { homedir } from "os";
import { join } from "path";
import {
  commands,
  extensions,
  window,
  workspace,
  env as vscodeEnv,
} from "vscode";

export const extName = "pico-w-go";
export const extId = "paulober.pico-w-go";

export const recommendedExtensions = [
  "ms-python.python",
  "visualstudioexptteam.vscodeintellicode",
  "ms-python.vscode-pylance",
];

/**
 * Opens the settings page for this extension in the settings editor window
 */
export function openSettings(): void {
  commands.executeCommand("workbench.action.openSettings", extName);
}

/**
 * Checks if any of the recommended extensions are not installed
 *
 * @returns true if any of the recommended extensions are not installed
 */
export function shouldRecommendExtensions(): boolean {
  return recommendedExtensions.some(extId => !extensions.getExtension(extId));
}

/**
 * Returns the path to the VS Code User settings/config folder
 *
 * @returns the path to the VS Code user folder
 */
export function getVsCodeUserPath(): string {
  const homeDir = homedir();

  let folder: string;

  switch (process.platform) {
    case "win32":
      folder = process.env.APPDATA || join(homeDir, "AppData", "Roaming");
      break;
    case "darwin":
      folder = join(homeDir, "Library", "Application Support");
      break;
    case "linux":
      folder = join(homeDir, ".config");
      break;
    default:
      folder = "/var/local";
  }

  return join(folder, "Code", "User");
}

/**
 * Returns the path to the currently opened project (aka first workspace folder)
 *
 * @returns the path to the currently opened project
 */
export function getProjectPath(): string | undefined {
  const workspaceFolders = workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    return workspaceFolders[0].uri.fsPath;
  }
}

/**
 * Returns the path to the currently focused file in the editor
 *
 * @returns the path to the currently selected file in the editor
 */
export function getFocusedFile(): string | undefined {
  const editor = window.activeTextEditor;
  if (editor === undefined) {
    return undefined;
  }

  const uri = editor.document.uri;

  return uri.scheme === "file" ? uri.fsPath : undefined;
}

/**
 * Returns the currently selected code or the current line if no selection is active
 *
 * @returns the currently selected code or the current line if no selection is active
 */
export function getSelectedCodeOrLine(): string | undefined {
  const editor = window.activeTextEditor;
  if (editor === undefined) {
    return undefined;
  }

  const selection = editor.selection;
  // no active selection? => get the current line
  let codeSnippet = !selection.isEmpty
    ? editor.document.getText(selection)
    : editor?.document.lineAt(selection.active.line).text;

  return codeSnippet;
}

export function writeIntoClipboard(text: string): void {
  vscodeEnv.clipboard.writeText(text);
}

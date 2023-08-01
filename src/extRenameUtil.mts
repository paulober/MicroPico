import { join } from "path";
import { TextDecoder, TextEncoder } from "util";
import { workspace, Uri } from "vscode";
import { getVsCodeUserPath } from "./api.mjs";

export async function renameUtilRun(): Promise<void> {
  if (
    workspace.workspaceFolders !== undefined &&
    workspace.workspaceFolders.length > 0
  ) {
    const folder = workspace.workspaceFolders[0].uri;

    await renameWorkspaceSettings(folder);
  }

  await renameGlobalSettings();

  await renameActivationFile();
}

async function renameWorkspaceSettings(folder: Uri): Promise<void> {
  const settingsURI = folder.with({
    path: join(folder.fsPath, ".vscode", "settings.json"),
  });

  const originalContent = await readSettingsJson(settingsURI);
  const modifiedContent = modifySettingsJson(settingsURI, originalContent);
  await writeSettingsJson(settingsURI, modifiedContent);
}

async function renameGlobalSettings(): Promise<void> {
  const settingsURI = Uri.file(join(getVsCodeUserPath(), "settings.json"));

  const originalContent = await readSettingsJson(settingsURI);
  const modifiedContent = modifySettingsJson(settingsURI, originalContent);
  await writeSettingsJson(settingsURI, modifiedContent);
}

async function readSettingsJson(settingsURI: Uri): Promise<string> {
  try {
    const settingsContent = await workspace.fs.readFile(settingsURI);

    return uint8ArrayToString(settingsContent);
  } catch (error) {
    console.error("Error reading settings.json:", error);

    return "";
  }
}

function modifySettingsJson(settingsURI: Uri, originalContent: string): string {
  // Apply your regex pattern to modify the content here
  const modifiedContent = originalContent.replace(
    /"picowgo\.([a-zA-Z.]+)":/g,
    '"micropico.$1":'
  );

  return modifiedContent;
}

function stringToUint8Array(inputString: string): Uint8Array {
  const encoder = new TextEncoder();

  return encoder.encode(inputString);
}

function uint8ArrayToString(uint8Array: Uint8Array): string {
  const decoder = new TextDecoder();

  return decoder.decode(uint8Array);
}

async function writeSettingsJson(
  settingsURI: Uri,
  modifiedContent: string
): Promise<void> {
  try {
    await workspace.fs.writeFile(
      settingsURI,
      stringToUint8Array(modifiedContent)
    );
    console.log("settings.json has been updated successfully!");
  } catch (error) {
    console.error("Error writing settings.json:", error);
  }
}

/**
 * Renames .picowgo activation file to .micropico
 */
async function renameActivationFile(): Promise<void> {
  if (
    workspace.workspaceFolders === undefined ||
    workspace.workspaceFolders.length === 0
  ) {
    return;
  }

  const folder = workspace.workspaceFolders[0];

  try {
    await workspace.fs.rename(
      Uri.joinPath(folder.uri, ".picowgo"),
      Uri.joinPath(folder.uri, ".micropico")
    );
  } catch (error) {
    // ignore error
  }
}

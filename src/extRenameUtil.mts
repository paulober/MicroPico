import { workspace, Uri } from "vscode";
import { getProjectWorkspaceFolder } from "./api.mjs";

/**
 * Renames .picowgo activation file to .micropico
 */
export async function renameActivationFile(): Promise<void> {
  const folder = getProjectWorkspaceFolder();
  if (folder === undefined) {
    return;
  }

  try {
    await workspace.fs.rename(
      Uri.joinPath(folder.uri, ".picowgo"),
      Uri.joinPath(folder.uri, ".micropico")
    );
  } catch {
    // ignore error
  }
}

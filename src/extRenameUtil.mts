import { workspace, Uri } from "vscode";

/**
 * Renames .picowgo activation file to .micropico
 */
export async function renameActivationFile(): Promise<void> {
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

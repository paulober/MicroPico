import * as vscode from 'vscode';
import SerialDolmatcher from '../serialDolmatcher';
import Directory from './picoDirectory';
import File from './picoFile';

export type Entry = File | Directory;

/**
 * Raspberry Pi Pico (W) remote fs integration of {@link vscode.FileSystemProvider}.
 *
 * All under the perspective of the COM port owned by this process so no other party can change contents!
 */
export class PicoWFs implements vscode.FileSystemProvider {
  private isConnected = false;
  private sd: SerialDolmatcher;

  constructor(sd: SerialDolmatcher) {
    this.sd = sd;
  }

  // --- manage file metadata

  stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
    if (this.isConnected) {
      return this.sd.fileStat(uri.path);
    } else {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
  }

  async readDirectory(
    uri: vscode.Uri
  ): Promise<[string, vscode.FileType][]> {
    // returns currently all files as type File (also things like SymbolicLink ...)
    return await this.sd.listAllFilesAndFolders(uri.path);
  }

  // --- manage file contents

  readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
    /*const data = this.lookupAsFile(uri, false).data;
    if (data) {
      return data;
    }*/
    throw vscode.FileSystemError.FileNotFound(uri);
  }

  writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: { readonly create: boolean; readonly overwrite: boolean }
  ): void | Thenable<void> {
    /*const basename = path.posix.basename(uri.path);
    const parent = this.lookupParentDirectory(uri);
    let entry = parent.entries.get(basename);

    // handle overwrite and such things...
    if (entry instanceof Directory) {
      throw vscode.FileSystemError.FileIsADirectory(uri);
    }

    if (!entry && !options.create) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }

    if (entry && options.create && !options.overwrite) {
      throw vscode.FileSystemError.FileExists(uri);
    }

    if (!entry) {
      entry = new File(basename);
      parent.entries.set(basename, entry);
      this.fireSoon({ type: vscode.FileChangeType.Created, uri });
    }

    // change properties
    entry.mtime = Date.now();
    entry.size = content.byteLength;
    entry.data = content;

    // fire changed event
    this.fireSoon({ type: vscode.FileChangeType.Changed, uri });*/
  }

  // --- manage files and folders

  delete(
    uri: vscode.Uri,
    options: { readonly recursive: boolean }
  ): void | Thenable<void> {
    /*const dirname = uri.with({ path: path.posix.dirname(uri.path) });
    const basename = path.posix.basename(uri.path);
    const parent = this.lookupAsDirectory(dirname, false);

    if (!parent.entries.has(basename)) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }

    parent.entries.delete(basename);
    parent.mtime = Date.now();
    parent.size -= 1;

    this.fireSoon(
      { type: vscode.FileChangeType.Changed, uri: dirname },
      { type: vscode.FileChangeType.Deleted, uri }
    );*/
  }

  rename(
    oldUri: vscode.Uri,
    newUri: vscode.Uri,
    options: { readonly overwrite: boolean }
  ): void | Thenable<void> {
    /*if (!options.overwrite && this.lookup(newUri, true)) {
      throw vscode.FileSystemError.FileExists(newUri);
    }

    const entry = this.lookup(oldUri, false);
    const oldParent = this.lookupParentDirectory(oldUri);

    const newParent = this.lookupParentDirectory(newUri);
    const newName = path.posix.basename(newUri.path);

    oldParent.entries.delete(entry.name);
    entry.name = newName;
    newParent.entries.set(newName, entry);

    this.fireSoon(
      { type: vscode.FileChangeType.Deleted, uri: oldUri },
      { type: vscode.FileChangeType.Created, uri: newUri }
    );*/
  }

  createDirectory(uri: vscode.Uri): void | Thenable<void> {
    /*const basename = path.posix.basename(uri.path);
    const dirname = uri.with({ path: path.posix.dirname(uri.path) });
    const parent = this.lookupAsDirectory(dirname, false);

    const entry = new Directory(basename);
    parent.entries.set(basename, entry);
    parent.mtime = Date.now();
    parent.size += 1;

    this.fireSoon(
      { type: vscode.FileChangeType.Changed, uri: dirname },
      { type: vscode.FileChangeType.Created, uri }
    );*/
  }

  // --- other

  /*
  copy?(
    source: vscode.Uri,
    destination: vscode.Uri,
    options: { readonly overwrite: boolean }
  ): void | Thenable<void> {
    throw new Error('Method not implemented.');
  }*/

  // --- manage file events

  private emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  private bufferedEvents: vscode.FileChangeEvent[] = [];
  private fireSoonHandle?: NodeJS.Timer;

  public onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> =
    this.emitter.event;

  watch(
    uri: vscode.Uri,
    options: {
      readonly recursive: boolean;
      readonly excludes: readonly string[];
    }
  ): vscode.Disposable {
    // ignore, fires for all changes...
    return new vscode.Disposable(() => {});
  }
}

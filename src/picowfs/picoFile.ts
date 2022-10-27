import * as vscode from 'vscode';

export default class File implements vscode.FileStat {
  type: vscode.FileType;
  ctime: number;
  mtime: number;
  size: number;
  permissions?: vscode.FilePermission | undefined;

  name: string;
  data?: Uint8Array;

  /**
   * Does only setup basic file properties.
   *
   * @param name Filename
   */
  constructor(name: string) {
    this.type = vscode.FileType.File;
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = 0;
    this.name = name;
  }
}

export const unknownFile = () => {
  const f = new File('');
  f.type = vscode.FileType.Unknown;
  return f;
};

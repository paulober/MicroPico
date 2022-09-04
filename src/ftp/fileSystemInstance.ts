// A new one of these is created for each connection, however
// we rely on a singleton underlying FtpFileSystem to marshal
// requests since we can't deal with concurrent FTP requests

import FtpFileSystem from './fileSystem';

// from multiple clients.
export default class FtpFileSystemInstance {
  private fileSystem: FtpFileSystem;
  private cwd: string;

  constructor(fileSystem: FtpFileSystem) {
    this.fileSystem = fileSystem;
    this.cwd = '/';
  }

  public get root() {
    return this.fileSystem.root;
  }

  public currentDirectory(): string {
    return this.cwd;
  }

  public async get(fileName: string) {
    return await this.fileSystem.get(this.cwd, fileName);
  }

  public async list(folderPath: string = '.') {
    return await this.fileSystem.list(this.cwd, folderPath);
  }

  public async chdir(folderPath = '.'): Promise<void> {
    this.cwd = await this.fileSystem.chdir(this.cwd, folderPath);
  }

  public async write(fileName: string, { append = false, start = 0 } = {}) {
    return await this.fileSystem.write(this.cwd, fileName, { append, start });
  }

  public async read(fileName: string, { start = 0 } = {}) {
    return await this.fileSystem.read(this.cwd, fileName, { start });
  }

  public async delete(fileOrFolderPath: string): Promise<void> {
    await this.fileSystem.delete(this.cwd, fileOrFolderPath);
  }

  public async mkdir(folderPath: string): Promise<void> {
    await this.fileSystem.mkdir(this.cwd, folderPath);
  }

  public async rename(from: string, to: string): Promise<void> {
    await this.fileSystem.rename(this.cwd, from, to);
  }

  public chmod(fileOrFolderPath: string, mode: any) {
    return this.fileSystem.chmod(this.cwd, fileOrFolderPath, mode);
  }

  public getUniqueName(): string {
    return this.fileSystem.getUniqueName();
  }
}

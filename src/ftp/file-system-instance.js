
// A new one of these is created for each connection, however
// we rely on a singleton underlying FtpFileSystem to marshal
// requests since we can't deal with concurrent FTP requests
// from multiple clients.
export default class FtpFileSystemInstance {
    constructor(fileSystem) {
        this._fileSystem = fileSystem;
        this._cwd = '/';
    }

      get root() {
        return this._fileSystem.root();
      }
    
      currentDirectory() {
        return this._cwd;
      }
    
      async get(fileName) {
        return await this._fileSystem.get(this._cwd, fileName);
      }
    
      async list(folderPath = '.') {
        return await this._fileSystem.list(this._cwd, folderPath);
      }
    
      async chdir(folderPath = '.') {
        this._cwd = await this._fileSystem.chdir(this._cwd, folderPath);
      }
    
      async write(fileName, { append = false, start = 0 } = {}) {
        return await this._fileSystem.write(this._cwd, fileName, { append, start });
      }
    
      async read(fileName, { start = 0 } = {}) {
        return await this._fileSystem.read(this._cwd, fileName, { start });
      }
    
      async delete(fileOrFolderPath) {
        await this._fileSystem.delete(this._cwd, fileOrFolderPath);
      }
    
      async mkdir(folderPath) {
        await this._fileSystem.mkdir(this._cwd, folderPath);
      }
    
      async rename(from, to) {
        await this._fileSystem.rename(this._cwd, from, to);
      }
    
      chmod(fileOrFolderPath, mode) {
        return this._fileSystem.chmod(this._cwd, fileOrFolderPath, mode);
      }
    
      getUniqueName() {
        return this._fileSystem.getUniqueName();
      }
}
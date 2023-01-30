import Shell from './shell';
import Config, { Constants } from '../config';
import Logger from '../logger';
import ApiWrapper from '../apiWrapper';
import ProjectStatus from './projectStatus';
import Utils from '../utils';
import FileWriter from './fileWriter';
import { promises as fsp } from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import Pyboard from './pyboard';
import SettingsWrapper, { SettingsKey } from '../settingsWrapper';
import Term from '../terminal';

export default class Sync {
  private logger: Logger;
  private api: ApiWrapper;
  private settings: SettingsWrapper;
  private board: Pyboard;
  private terminal: Term;
  private shell: Shell | null;
  private inRawMode: boolean;
  public totalFileSize: number;
  public totalNumberOfFiles: number;
  private numberOfChangedFiles: number;
  private methodAction: string;
  private methodName: string;
  private utils: Utils;
  private config: Constants;
  private projectPath: any;
  private isRunning: boolean;
  private isStopping: boolean;
  public fails: number;
  public compressionLimit: number;
  private projectStatus: ProjectStatus;
  // DON'T CREATE A FOLDER NAMED LIKE THAT IF YOU DON'T WANT TO CAUSE AN UNEXPECTED BEHAVIOUR
  private pyFolder: string = "I'M an unbelivable folder";
  private progressFileCount?: number;
  private oncomplete: any;
  private method: any;
  private projectName: any;
  private folderName: any;
  private files: any;
  private choiceTimeout?: number;
  public maxFailures?: number;

  constructor(board: Pyboard, settings: SettingsWrapper, terminal: Term) {
    this.logger = new Logger('Sync');
    this.api = new ApiWrapper();
    this.settings = settings;
    this.board = board;
    this.terminal = terminal;
    this.shell = null;
    this.inRawMode = false;
    this.totalFileSize = 0;
    this.totalNumberOfFiles = 0;
    this.numberOfChangedFiles = 0;
    this.methodAction = 'Downloading';
    this.methodName = 'Download';

    this.utils = new Utils(settings);
    this.config = Config.constants();
    this.projectPath = this.api.getProjectPath();
    this.isRunning = false;
    this.isStopping = false;
    this.fails = 0;
    this.compressionLimit = 5; // minimum file size in kb that will be compressed
    this.setPaths();
    this.projectStatus = new ProjectStatus(
      this.shell,
      this.settings,
      this.pyFolder!
    );
  }

  private async isReady() {
    // check if there is a project open
    if (!this.projectPath) {
      return new Error('No project open');
    }
    // check if project exists
    if (!(await this.exists(this.pyFolder))) {
      console.log("Py folder doesn't exist");
      return new Error(
        "Unable to find folder '" +
          this.settings.get(SettingsKey.syncFolder) +
          "' in your project. Please add the correct folder in your settings"
      );
    }

    return true;
  }

  private async exists(dir: string) {
    return await Utils.exists(dir);
  }

  private progress(text: string, count?: boolean) {
    if (count) {
      if (this.progressFileCount === undefined) {
        this.progressFileCount = 0;
      }
      this.progressFileCount += 1;
      text =
        '[' +
        this.progressFileCount.toString() +
        '/' +
        this.numberOfChangedFiles +
        '] ' +
        text;
    }
    let _this = this;
    setTimeout(function () {
      _this.terminal.writeln(text);
    }, 0);
  }

  private syncDone(err?: Error) {
    this.logger.verbose('Sync done!');
    this.isRunning = false;
    let mssg = this.methodName + ' done';
    if (err) {
      let errMsg = err.message ? err.message : err;
      mssg = this.methodName + ' failed.';
      mssg += errMsg;
      // if (this.inRawMode) {
      //   mssg += ' Please reboot your device manually.';
      // }
    } else if (
      this.inRawMode &&
      (this.settings.get(SettingsKey.rebootAfterUpload) as boolean)
    ) {
      mssg += ', resetting board...';
    }

    this.terminal.writeln(mssg);

    if (this.board.connected && !this.inRawMode) {
      this.terminal.writePrompt();
    }

    if (this.oncomplete) {
      this.oncomplete();
      this.oncomplete = null;
    } else {
      this.logger.warning('Oncomplete not set!');
    }
  }

  private resetValues(oncomplete: Function, method: string) {
    // prepare variables
    if (method !== 'receive') {
      method = 'send';
      this.methodAction = 'Uploading';
      this.methodName = 'Upload';
    }
    this.method = method;
    this.oncomplete = oncomplete;
    this.totalFileSize = 0;
    this.totalNumberOfFiles = 0;
    this.numberOfChangedFiles = 0;
    this.progressFileCount = 0;
    this.isRunning = true;
    this.inRawMode = false;
    this.setPaths();
  }

  public setPaths(): void {
    this.projectPath = this.api.getProjectPath();
    if (this.projectPath) {
      this.projectName = this.projectPath.split('/').pop();

      let dir = (this.settings.get(SettingsKey.syncFolder) as string).replace(
        /^\/|\/$/g,
        ''
      ); // remove first and last slash
      this.pyFolder = this.projectPath + path.sep;
      if (dir) {
        this.pyFolder += dir + path.sep;
      }

      let syncFolder = this.settings.get(SettingsKey.syncFolder) as string;
      let folderName = syncFolder === '' ? 'main folder' : syncFolder;
      this.folderName = folderName;
    }
  }

  public async startSend(onComplete: Function, files: string) {
    await this.settings.refresh();
    await this.startSync(onComplete, 'send', files);
  }

  public async startReceive(oncomplete: Function, files?: string) {
    await this.settings.refresh();
    await this.startSync(oncomplete, 'receive', files);
  }

  private async startSync(oncomplete: Function, method: string, files?: string) {
    this.logger.info('Start sync method ' + method);
    this.fails = 0;
    this.method = method;

    try {
      this.resetValues(oncomplete, method);
    } catch (e: any) {
      if (e instanceof Error) {
        this.logger.error(e.message);
        this.syncDone(e);
      } else {
        this.logger.error(e);
        this.syncDone(new Error(e));
      }
      return;
    }

    // check if project is ready to sync
    let ready = await this.isReady();
    if (ready instanceof Error) {
      this.syncDone(ready);
      return;
    }

    // make sure next messages will be written on a new line
    this.terminal.enter();

    if (files) {
      let filename = files.split(path.sep).pop();
      this.terminal.write(
        `${this.methodAction} current file (${filename})...\r\n`
      );
    } else {
      this.terminal.write(
        `${this.methodAction} project (${this.folderName})...\r\n`
      );
    }

    try {
      await this.safeBoot();
      this.logger.info('Safeboot succesful');
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error('Safeboot failed');
        this.logger.error(err.message);
        this.progress(
          `Safe boot failed, '${this.methodAction.toLowerCase()} anyway.`
        );
      } else {
        this.logger.error('Safeboot failed');
        this.logger.error(err as string);
        this.progress(
          `Safe boot failed, '${this.methodAction.toLowerCase()} anyway.`
        );
      }
    }

    this.logger.silly('Start shell');

    try {
      await this.startShell();

      this.inRawMode = true;

      let direction = 'to';
      if (this.methodAction.toLowerCase() === 'downloading') {
        direction = 'from';
      }
      this.terminal.write(
        `${this.methodAction} ${direction} ${this.shell?.mcuRootFolder} ...\r\n`
      );

      this.projectStatus = new ProjectStatus(
        this.shell,
        this.settings,
        this.pyFolder
      );
      this.logger.silly('Entered raw mode');

      if (!this.isRunning) {
        console.log("Sync err2");
        this.stoppedByUser();
        return;
      }
    } catch (err: any) {
      console.log("Sync err1");
      if (err instanceof Error) {
        this.logger.error(err.message);
        await this.throwError(err);
        this.exit();
      } else {
        this.logger.error(err);
        await this.throwError(new Error(err));
        this.exit();
      }
      return;
    }

    if (this.method === 'receive') {
      await this.receive();
    } else {
      await this.send(files);
    }

    console.log("Sync donedd");
    this.syncDone();
  }

  private async receive() {
    this.progress('Reading files from board');

    let fileList = null;

    try {
      fileList = await this.shell?.list('.', true, false);
      fileList = _.filter(fileList, (x: any) => x.Type === 'file');
      fileList = _.map(fileList, (x: any) => x.Fullname.substr(1));
    } catch (err) {
      this.progress(
        'Failed to read files from board, canceling file download'
      );
      await this.throwError(err as Error);
      return;
    }

    this.files = await this.getFilesRecursive(''); // files on PC

    let newFiles = [];
    let existingFiles = [];

    fileList = this.utils.ignoreFilter(fileList);

    for (let i = 0; i < fileList.length; i++) {
      let file = fileList[i];
      if (this.files.indexOf(file) > -1) {
        existingFiles.push(file);
      } else {
        newFiles.push(file);
      }
    }
    fileList = existingFiles.concat(newFiles);

    let mssg = 'No files found on the board to download';

    if (newFiles.length > 0) {
      mssg = `Found ${newFiles.length} new ${this.utils.plural(
        'file',
        fileList.length
      )}`;
    }

    if (existingFiles.length > 0) {
      if (newFiles.length === 0) {
        mssg = 'Found ';
      } else {
        mssg += ' and ';
      }
      mssg += `${existingFiles.length} existing ${this.utils.plural(
        'file',
        fileList.length
      )}`;
    }

    this.choiceTimeout = Date.now();

    let options: string[] = ['Yes', 'Cancel'];

    if (newFiles.length > 0) {
      options.push('Only new files');
    }

    await Utils.sleep(100);

    if (fileList.length === 0) {
      await this.complete();
      return true;
    }

    mssg = `${mssg}. Do you want to download these files into your project (${this.projectName} - ${this.folderName}), overwriting existing files?`;

    let chosen = await this.api.confirm(mssg, ...options);

    switch (chosen) {
      case 'Cancel':
        await this.receiveCancel();
        break;
      case 'Yes':
        await this.receiveOverwrite(fileList);
        break;
      case 'Only new files':
        await this.receiveOnlyNew(newFiles);
        break;
    }
  }

  private checkChoiceTimeout() {
    if (this.choiceTimeout === undefined) {
      this.choiceTimeout = 0;
    }
    if (Date.now() - this.choiceTimeout > 29000) {
      this.throwError(new Error('Choice timeout (30 seconds) occurred.'));
      return false;
    }
    return true;
  }

  private async receiveCancel() {
    if (this.checkChoiceTimeout()) {
      this.progress('Cancelled');
      await this.complete();
    }
  }

  private async receiveOverwrite(fileList: string[]) {
    if (this.checkChoiceTimeout()) {
      this.progress(
        `Downloading ${fileList.length} ${this.utils.plural(
          'file',
          fileList.length
        )}...`
      );
      this.progressFileCount = 0;
      this.numberOfChangedFiles = fileList.length;

      await this.receiveFiles(fileList);

      this.logger.info('All items received');
      this.progress('All items overwritten');
      await this.complete();
    }
  }

  private async receiveOnlyNew(newFiles: string[]) {
    if (this.checkChoiceTimeout()) {
      this.progress('Downloading ' + newFiles.length + ' files...');
      this.progressFileCount = 0;
      this.numberOfChangedFiles = newFiles.length;

      await this.receiveFiles(newFiles);

      this.logger.info('All items received');
      this.progress('All items overwritten');
      await this.complete();
    }
  }

  private async safeBoot() {
    await this.board.stopRunningProgramsDouble(500);

    if (!(this.settings.get(SettingsKey.safeBootOnUpload) as boolean)) {
      this.progress('Not safe booting, disabled in settings');
      return false;
    }

    if (!this.board.isSerial) {
      return false;
    }

    this.logger.info('Safe booting...');
    this.progress('Safe booting device... (see settings for more info)');
    await this.board.safeboot(4000);
  }

  private async receiveFiles(list: string[]) {
    for (let boardName of list) {
      this.progress(`Reading ${boardName}`, true);

      let localName = this.pyFolder + boardName;
      let buffer = null;

      try {
        let result = await this.shell?.readFile(boardName);
        buffer = result?.buffer;
      } catch (err: any) {
        this.progress(`Failed to download ${boardName}`);
        this.logger.error(err);
        continue;
      }

      try {
        if (buffer === undefined || buffer === null) {
          throw new Error('Buffer is null or undefined');
        }
        await this.utils.ensureFileDirectoryExistence(localName);
        await fsp.writeFile(localName, buffer);
      } catch (e: any) {
        this.logger.error(`Failed to open and write ${localName}`);
        this.logger.error(e);
        this.progress(`Failed to write to local file ${boardName}`);
      }
    }
  }

  private async send(files: any) {
    this.progress('Reading file status');
    this.logger.info('Reading serialDolmatcher file');

    if (!this.isRunning) {
      this.stoppedByUser();
      return;
    }

    // if files given, only upload those files
    if (files) {
      if (!Array.isArray(files)) {
        // TODO: hopefully it was no fault to cast next line as string[] (if it would be number[] :(
        files = await this.projectStatus.prepareFile(this.pyFolder, files);
        files = [files];

        this.progress('Uploading single file');
      } else {
        this.progress(`Uploading ${files.length} files`);
      }

      this.numberOfChangedFiles = files.length;
      await this.writeFiles(files);
    } else {
      // TODO: this call seems to be there just to drive a log message.. better place for it?
      // otherwise, write changes based on project status file
      try {
        await this.projectStatus.read();
      } catch (err) {
        this.progress('Failed to read project status, uploading all files');
      }

      await this.writeChanges();
    }
  }

  private async writeChanges() {
    let changes = this.projectStatus.getChanges();

    let deletes = changes['delete'];
    let changedFiles = changes['files'];
    let changedFolders = changes['folders'];
    let changedFilesFolders = changedFolders.concat(changedFiles);

    this.numberOfChangedFiles = changedFiles.length;
    this.maxFailures = Math.min(Math.ceil(changedFiles.length / 2), 5);

    if (deletes.length > 0) {
      this.progress(`Deleting ${deletes.length} files and folders`);
    }

    if (
      deletes.length === 0 &&
      changedFiles.length === 0 &&
      changedFolders.length === 0
    ) {
      this.progress('No files to upload');
      await this.complete();
      return;
    }

    this.logger.info('Removing files');

    await this.removeFilesRecursive(deletes);

    if (!this.isRunning) {
      this.stoppedByUser();
      return;
    }
    if (deletes.length > 0) {
      this.logger.info('Updating project-status file');
    }

    await this.projectStatus.write();

    await this.writeFiles(changedFilesFolders);
  }

  private async writeFiles(filesAndFolders: any) {
    this.logger.info('Writing changed folders');

    try {
      await this.writeFilesRecursive(filesAndFolders);

      if (!this.isRunning) {
        this.stoppedByUser();
        return;
      }
    } catch (err: any) {
      if (err instanceof Error) {
        await this.throwError(err);
      }
      return;
    }

    this.logger.info('Writing project file');

    try {
      await this.projectStatus.write();

      if (!this.isRunning) {
        this.stoppedByUser();
        return;
      }

      this.logger.info('Exiting...');
      await this.complete();
    } catch (err) {
      if (err instanceof Error) {
        await this.throwError(err);
      }
      return;
    }
  }

  public stopSilent(): void {
    this.logger.info('Stopping sync');
    this.isRunning = false;
  }

  public async stop(): Promise<void> {
    this.stopSilent();

    if (!this.shell) {
      this.isRunning = false;
      return;
    }

    await this.shell.stopWorking();

    this.isRunning = false;

    await this.projectStatus.write();

    await this.complete();
    this.board.stopWaitingForSilent();
  }

  private stoppedByUser() {
    this.logger.warning('Sync cancelled');
    if (!this.isStopping) {
      this.isStopping = true;
    }
  }

  private async throwError(err?: Error) {
    let mssg = err ? err : new Error('');

    this.logger.warning('Error thrown during sync procedure');

    await this.syncDone(mssg);

    let promise = this.board.stopWaitingForSilent();

    if (promise !== undefined) {
      await promise;
    }

    await this.exit();
    await this.board.enterFriendlyReplNonBlocking();
  }

  private async complete() {
    try {
      await this.utils.rmdir(
        this.projectPath + '/' + this.config.compressedFilesFolder
      );
    } catch (e: any) {
      this.logger.info(
        "Removing py_compressed folder failed, likely it didn't exist"
      );
      this.logger.info(e);
    }

    await this.exit();

    if (this.oncomplete) {
      this.oncomplete();
      this.logger.warning('Oncomplete executed, setting to null');
      this.oncomplete = null;
    }
  }

  private async removeFilesRecursive(files: any, depth?: number) {
    if (!depth) {
      depth = 0;
    }

    if (files.length === 0) {
      return;
    } else {
      let file = files[0];
      let filename = file[0];
      let type = file[1];
      if (type === 'd') {
        this.progress('Removing dir ' + filename);

        try {
          await this.shell?.removeDir(filename);
        } catch (err) {
          this.progress('Failed to remove dir ' + filename);
        }

        this.projectStatus.update(filename);

        if (!this.isRunning) {
          this.stoppedByUser();
          return;
        }

        files.splice(0, 1);
        await this.removeFilesRecursive(files, depth + 1);
      } else {
        this.progress('Removing file ' + filename);

        try {
          await this.shell?.removeFile(filename);
        } catch (err) {
          this.progress('Failed to remove file ' + filename);
        }

        this.projectStatus.update(filename);

        if (!this.isRunning) {
          this.stoppedByUser();
          return;
        }

        files.splice(0, 1);
        await this.removeFilesRecursive(files, depth + 1);
      }
    }
  }

  private async writeFilesRecursive(files: any, depth?: number) {
    if (!depth) {
      depth = 0;
    }

    if (depth > 0 && depth % 8 === 0) {
      this.logger.info('Updating project-status file');
      await this.projectStatus.write();
    }

    if (files.length === 0) {
      return;
    } else {
      let file = files[0];
      let filename = file[0];
      let type = file[1];
      let size = file[3] ? Math.round(file[3] / 1024) : 0;
      let filePath = this.pyFolder + filename;

      if (type === 'f' && this.shell) {
        let fw = new FileWriter(
          this.shell,
          this.board,
          this.settings,
          this.api
        );
        let startTime = new Date().getTime();
        let message = `Writing file '${filename}' (${
          size === 0 ? file[3] : size
        } ${size === 0 ? 'bytes' : 'kB'})`;
        this.progress(message, true);

        try {
          await fw.writeFile(filePath);

          let endTime = new Date().getTime();
          let duration = (endTime - startTime) / 1000;
          this.logger.info('Completed in ' + duration + ' seconds');

          this.projectStatus.update(filename);

          if (!this.isRunning) {
            this.stoppedByUser();
            return;
          }

          files.splice(0, 1);
          await this.writeFilesRecursive(files, depth + 1);
        } catch (err) {
          if (err instanceof Error) {
            this.progress(err.message);
            this.logger.error(err);
            throw err;
          } else {
            throw new Error("WT* !, err is not instance of Error. Are we still on earth?!");
          }
        }
      } else {
        this.progress('Creating dir ' + filename);
        await this.shell?.createDir(filename);

        this.projectStatus.update(filename);
        files.splice(0, 1);
        await this.writeFilesRecursive(files, depth + 1);
      }
    }
  }

  private async startShell() {
    this.shell = new Shell(this.board, this.settings);
    await this.shell.initialise();
  }

  private async getFiles(dir: string) {
    return await fsp.readdir(dir);
  }

  private async getFilesRecursive(dir: string) {
    let files = await fsp.readdir(this.pyFolder + dir);
    let list: string[] = [];
    for (let i = 0; i < files.length; i++) {
      let filename = dir + files[i];
      let filePath = this.pyFolder + filename;
      let stats = await fsp.lstat(filePath);
      if (!stats.isDirectory()) {
        list.push(filename);
      } else {
        list = list.concat(await this.getFilesRecursive(filename + '/'));
      }
    }
    return list;
  }

  private async exit() {
    await this.shell?.exit();
  }
}

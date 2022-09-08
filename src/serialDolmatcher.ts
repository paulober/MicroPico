import Sync from './rp2/sync';
import Runner from './rp2/runner';
import PySerial from './connections/pyserial';
import Utils from './utils';
import ApiWrapper from './apiWrapper';
import Logger from './logger';
import Config, { Constants } from './config';
import { EventEmitter } from 'events';
import * as vscode from 'vscode';
import FtpFileSystem from './ftp/fileSystem';
import FtpSrv from 'ftp-srv';
import Pyboard from './rp2/pyboard';
import SettingsWrapper, { SettingsKey, SettingsType } from './settingsWrapper';
import FtpFileSystemInstance from './ftp/fileSystemInstance';
import fetch from 'node-fetch';
import * as semver from 'semver';
import PanelView from './panelView';

const IDLE = 0;
const SYNCHRONIZING = 1;
const DELETING = 2;
const RUNNING = 3;
const LISTENINGFTP = 4;

export type ServerVersion = {
  version: string | undefined;
  date: string;
  url: string;
  numbers1: string | undefined;
  numbers2: string | undefined;
};

export default class SerialDolmatcher extends EventEmitter {
  public board: Pyboard;
  private synchronizeType: string;
  private settings: SettingsWrapper;
  private api: ApiWrapper;
  private logger: Logger;
  private config: Constants;
  private view: PanelView;
  private autoconnectTimer: NodeJS.Timer | null;
  private autoconnectAddress: string | null;
  private connectionTimer?: NodeJS.Timer;
  private utils: Utils;
  private terminal: any;
  private runner: any;
  private outputHidden: boolean;
  private status: number;
  private _fileSystems: any;
  private syncObj: any;
  private ftpServer?: FtpSrv;
  private _fs?: FtpFileSystem;
  private firstTimeStart?: boolean;

  constructor(
    serializedState: any,
    pyboard: Pyboard,
    view: PanelView,
    settings: SettingsWrapper
  ) {
    super();
    let _this = this;
    this.board = pyboard;
    this.synchronizeType = '';
    this.settings = settings;
    this.api = new ApiWrapper();
    this.logger = new Logger('Pymakr');
    this.config = Config.constants();
    this.view = view;
    this.autoconnectTimer = null;
    this.autoconnectAddress = null;
    this.utils = new Utils(settings);
    this.terminal = this.view.terminal;
    this.runner = new Runner(pyboard, this.terminal, this);
    this.outputHidden = false;
    this.status = IDLE;
    this._fileSystems;

    /*
    communication example between settingsWrapper and SerialDolmatcher to write to the terminal
    // in settingsWrapper.ts
    this.emit('format_error')

    // here
    this.settings.on('format_error', function () {
      _this.terminal.writeln('JSON format error in global pico-w-go.json file');
      if (_this.board.connected) {
        _this.terminal.writePrompt();
      }
    });*/

    this.view.on('term-connected', async function (err: any) {
      // removed this because it's maybe not needed anymore because of the new settings structure
      // _this.settings.setFileChangedGlobal();
      if (err) {
        _this.logger.error('Error from terminal connect:');
        if (typeof err === 'string') {
          _this.logger.error(err);
        } else {
          _this.logger.error(err.message);
        }
        _this.api.error('Unable to start the terminal');
      }
      _this.logger.info('Connected trigger from view');

      _this.firstTimeStart = !(await _this.api.settingsExist());
      if (_this.firstTimeStart) {
        _this.firstTimeStart = false;
        _this.api.openSettings();
        _this.writeGetStartedText();
      }

      // hide panel if it was hidden after last shutdown of atom
      let closeTerminal =
        serializedState &&
        'visible' in serializedState &&
        !serializedState.visible;

      if (!_this.settings.get(SettingsKey.openOnStart) || closeTerminal) {
        await _this.hidePanel();
      } else {
        await _this.startAutoConnect(true);
      }
    });

    this.view.on('terminal_click', async function () {
      _this.logger.verbose('Terminal click emitted');
      if (!_this.board.connected && !_this.board.connecting) {
        _this.logger.verbose('Connecting because of terminal click');
        await _this.connect();
      }
    });

    this.view.on('user_input', function (input: string) {
      _this.board.sendUserInput(input).catch(async (err) => {
        if (err && err.message === 'timeout') {
          _this.logger.warning('User input timeout, disconnecting');
          _this.logger.warning(err);
          await _this.disconnect();
        }
      });
    });

    this.on('auto_connect', async function (address) {
      if (!_this.board.connecting) {
        _this.logger.verbose(
          'Autoconnect event, disconnecting and connecting again'
        );
        await _this.connect(address);
      }
    });

    this.board.registerStatusListener(function (status: number) {
      if (status === 3) {
        _this.terminal.enter();
      }
    });

    this.settings.onChange(
      'auto_connect',
      async function (oldValue: SettingsType, newValue: SettingsType) {
        _this.logger.info('autoConnect setting changed to ' + newValue);
        await _this._stopAutoConnect();
        await _this.startAutoConnect();
      }
    );
  }

  private async startAutoConnect(wait?: boolean) {
    if (this.view.visible) {
      let _this = this;
      this.logger.info('Starting autoconnect interval...');
      await this._stopAutoConnect();
      //this.terminal.writeln("AutoConnect enabled, ignoring 'address' setting (see Global Settings)")
      this.terminal.writeln('Searching for boards on serial devices...');
      if (!wait) {
        await this._setAutoconnectAddress();
      }
      this.autoconnectTimer = setInterval(async function () {
        await _this._setAutoconnectAddress();
      }, 2500);
    }
  }

  async _stopAutoConnect() {
    let previous = this.board.address;
    if (this.autoconnectTimer) {
      this.logger.info('Stop autoconnect');
      clearInterval(this.autoconnectTimer);
      previous = this.autoconnectAddress;
      this.autoconnectAddress = null;
    }
    if (
      previous !== this.settings.address &&
      (this.board.connected || this.board.connecting)
    ) {
      this.logger.info('Disconnecting from previous autoconnect address');
      await this.disconnect();
    }
  }

  async _setAutoconnectAddress() {
    let address = await this.getAutoconnectAddress();

    this.logger.silly('Found address: ' + address);
    if (this.autoconnectAddress === undefined && !address) {
      // undefined means first time use
      this.terminal.writeln('No boards found on USB');
    } else if (address && address !== this.autoconnectAddress) {
      this.logger.silly('Found a board on USB: ' + address);
      this.emit('auto_connect', address);
    } else if (this.autoconnectAddress && !address) {
      this.autoconnectAddress = null;
      await this.disconnect();
      this.terminal.writeln('\r\nPrevious board is not available anymore');
      this.logger.silly('Previous board is not available anymore');
    } else if (!address) {
      this.logger.silly('No address found');
    } else {
      this.logger.silly('Ignoring address ' + address + ' for now');
    }

    this.autoconnectAddress = address;
  }

  private async getAutoconnectAddress(): Promise<string | null> {
    if (
      !(this.settings.get(SettingsKey.autoConnect) as boolean) &&
      this.settings.get(SettingsKey.manualComDevice) &&
      (this.settings.get(SettingsKey.manualComDevice) as string).length > 0
    ) {
      this.logger.silly('Manual COM port or device configured.');
      return this.settings.get(SettingsKey.manualComDevice) as string;
    }

    if ((this.settings.get(SettingsKey.autoConnect) as boolean)) {
      this.logger.silly('Autoconnect enabled');
      let result = await this._getBoard();

      let currentAddress = this.board.address;
      if (result.name) {
        if (!this.board.connected) {
          return result.name;
        }

        if (result.name !== this.board.address) {
          if (
            result.list.indexOf(currentAddress!) > -1 ||
            !this.board.isSerial
          ) {
            return result.name;
          }

          this.logger.silly(
            'already connected to a different board, or connected over telnet'
          );
          return null;
        }

        this.logger.silly('already connected to the correct board');
        return result.name;
      }
    }

    return null;
  }

  async _getBoard() {
    let result = await PySerial.listTargetBoards(this.settings);

    if (result.names.length > 0) {
      let name = result.names[0];
      let manu = result.manus[0];

      return {
        name: name,
        manu: manu,
        list: result.names,
      };
    }

    return {
      name: null,
      manu: null,
      list: result.names,
    };
  }

  async openProjectSettings() {
    try {
      await this.settings.openProjectSettings();
    } catch (err: any) {
      console.log(err);
      this.terminal.writeln(err.message);
      if (this.board.connected) {
        this.terminal.writePrompt();
      }
    }
  }

  async openGlobalSettings() {
    await this.api.openSettings();
  }

  public async getSerial(): Promise<void> {
    this.terminal.enter();
    let result = await PySerial.listBoards(this.settings);

    this.terminal.writeln(
      'Found ' +
        result.names.length +
        ' serialport' +
        (result.names.length === 1 ? '' : 's')
    );

    for (let i = 0; i < result.names.length; i++) {
      let name = result.names[i];
      let text = name + ' (' + result.manus[i] + ')';
      if (i === 0) {
        await this.api.writeToClipboard(name);
        text += ' (copied to clipboard)';
      }

      this.terminal.writeln(text);
    }

    this.terminal.writePrompt();
  }

  public async connect(address?: string, clickaction?: any) {
    this.logger.info('Connecting...');
    if (address) {
      this.logger.info(address);
    }

    if (this.autoconnectAddress) {
      if (!address) {
        address = this.autoconnectAddress;
        this.logger.info('Using autoconnect address: ' + address);
      }
    }
    if (this.settings.get(SettingsKey.autoConnect) && !address && clickaction) {
      this.terminal.writeln('AutoConnect: No device available');
    }

    let state = await this.api.getConnectionState(address!);
    let ts = new Date().getTime();
    if (
      state &&
      state['project'] !== this.view.projectName &&
      state['timestamp'] > ts - 11000
    ) {
      this.terminal.writeln(
        "Already connected in another window (project '" +
          state['project'] +
          "')"
      );
      return;
    }

    if (!address && this.settings.get(SettingsKey.autoConnect)) {
      let r = await this.getAutoconnectAddress();
      if (r !== null) {
        this.board.setAddress(r);
        address = r;
      }
    } else {
      if (address) {
        this.board.setAddress(address);
      }
    }

    // stop config observer from triggering again
    if (this.board.connected || this.board.connecting) {
      this.logger.info('Still connected or connecting... disconnecting first');
      await this.disconnect();
    }

    this.stopOperation();
    this.board.status = 0;
    this.outputHidden = false;

    await this.board.refreshConfig();

    let connectPreamble = '';

    if (address === '' || address === null || address === undefined) {
      if (!this.settings.get(SettingsKey.autoConnect)) {
        this.terminal.writeln(
          'Address not configured. Please go to the settings to configure a valid address or comport'
        );
      }
    } else {
      this.terminal.writeln(
        connectPreamble + 'Connecting to ' + address + '...'
      );

      // start connection to address via the pyboard interface and the pyserial module
      await this.board.connect(
        address,
        this.onConnected.bind(this),
        this.onErrored.bind(this),
        this.onTimedOut.bind(this),
        this.onMessageReceived.bind(this)
      );
    }
  }

  /**
   * Event handler for when the board is connected.
   * 
   * @param err Error
   * @param address Address connected to
   */
  private async onConnected(err: string, address?: string): Promise<void> {
    let _this = this;

    if (err || !address) {
      if (!err) {
        err = 'onConnected to undefined address';
      }
      this.terminal.writeln('Connection error: ' + err);
    } else {
      await this.api.setConnectionState(address, true, this.view.projectName);
      this.connectionTimer = setInterval(async function () {
        if (_this.board.connected) {
          await _this.api.setConnectionState(
            address,
            true,
            _this.view.projectName
          );
        } else {
          clearTimeout(_this.connectionTimer);
        }
      }, 10000);
    }

    this.view.setButtonState();
  }

  /**
   * Event handler for when the connection to the board has thown an error.
   * 
   * @param err The thrown error
   */
  private async onErrored(err: Error): Promise<void> {
    let message = this.board.getErrorMessage(err.message);
    if (message === '') {
      message = err.message ? err.message : 'Unknown error';
    }
    if (this.board.connected) {
      this.logger.warning('An error occurred: ' + message);
      if (this.isSynchronizing()) {
        this.terminal.writeln('An error occurred: ' + message);
        this.logger.warning('Synchronizing, stopping sync');
        await this.syncObj.stop();
      }
    } else {
      this.terminal.writeln(
        '> Failed to connect (' +
          message +
          '). Click the "Pico Disconnected" button (or unplug and than plug the pico back in if it still not works) to try again.'
      );
      this.view.setButtonState();
    }
  }

  /**
   * Event handler for when the connection to the board has timed out.
   * 
   * @param err The thrown timed-out error
   */
  private onTimedOut(err: Error): void {
    this.board.connected = false;
    this.terminal.enter();
    this.terminal.writeln(
      '> Connection timed out. Click the "Pico Disconnected" button to try again.'
    );
    this.view.setButtonState();
  }

  /**
   * Event handler for when a message is received from the board.
   * 
   * @param msg The message received
   */
  private onMessageReceived(msg: string): void {
    if (!this.isSynchronizing() && !this.outputHidden) {
      this.terminal.write(msg);
    }
  }

  public async disconnect(): Promise<void> {
    this.logger.info('Disconnecting...');

    let showMessage = false;

    if (this.board.connected) {
      showMessage = true;
    }

    if (this.board.isConnecting()) {
      this.terminal.enter();
      this.terminal.writeln('Connection attempt cancelled');
    }

    clearInterval(this.connectionTimer);
    if (this.board.address !== null) {
      await this.api.setConnectionState(this.board.address, false);
    }

    await this.board.disconnect();

    this.stopOperation();

    await this.runner.stop();
    this.view.setButtonState();

    if (showMessage) {
      this.terminal.writeln('\r\nDisconnected');
    }
  }

  public async run(): Promise<void> {
    if (!this.board.connected) {
      this.terminal.writeln('Please connect your device');
      return;
    }
    if (this.isIdle()) {
      try {
        this.startOperation('picowgo.run', RUNNING);

        let code = this.api.getSelected();
        // if user has selected code, run that instead of the file
        if (code) {
          await this.runSelection();
        } else {
          await this.runner.toggle();
        }
      } finally {
        this.stopOperation();
      }
    } else if (this.isRunning()) {
      try {
        await this.runner.toggle();
      } finally {
        this.stopOperation();
      }
    }
  }

  public async runSelection(): Promise<void> {
    if (!this.board.connected) {
      this.terminal.writeln('Please connect your device');
      return;
    }

    if (this.isIdle()) {
      let code = this.api.getSelectedOrLine();

      try {
        await this.runner.selection(code);
        this.api.editorFocus();
      } catch (err) {
        this.logger.error('Failed to send and execute codeblock ');
      }
    }
  }

  public async upload(): Promise<void> {
    if (this.isIdle()) {
      await this.sync('send');
    } else if (this.isSynchronizing()) {
      await this.stopSync();
    }
  }

  public async uploadFile(): Promise<void> {
    let file = this.api.getOpenFile();

    if (file !== null) {
      if (!file.path) {
        this.api.warning('No file open to upload');
      } else {
        this.logger.info(file.path);
        await this.sync('send', file.path);
      }
    }
  }

  public async deleteAllFiles(): Promise<void> {
    this.logger.info('Delete All Files');

    if (!this.board.connected) {
      this.terminal.writeln('Please connect your device');
      return;
    }

    let options = ['Yes', 'Cancel'];

    let choice = await this.api.confirm(
      'Are you sure you want to delete all files and directories from the board?',
      ...options
    );

    if (choice === 'Yes') {
      if (this.isIdle()) {
        this.status = DELETING;

        let command =
          'import uos as os\r\n' +
          'def deltree(target):\r\n' +
          '  for d in os.listdir(target):\r\n' +
          "    if target == '/':\r\n" +
          '      current = target + d\r\n' +
          '    else:\r\n' +
          "      current = target + '/' + d\r\n" +
          '    try:\r\n' +
          '      deltree(current)\r\n' +
          "      print('Deleting \\'' + current + '\\' ...')\r\n" +
          '    except OSError:\r\n' +
          "      print('Deleting \\'' + current + '\\' ...')\r\n" +
          '      os.remove(current)\r\n' +
          "  if target != '/':\r\n" +
          '    os.rmdir(target)\r\n' +
          "deltree('/')\r\n" +
          "print('\\r\\nAll files and directories have been deleted from the board.\\r\\n')";

        try {
          await this.board.run(command);
          this.api.editorFocus();
        } catch (err) {
          this.logger.error('Failed to send and execute codeblock ');
        } finally {
          this.status = IDLE;
        }
      }
    }
  }

  public async download(): Promise<void> {
    await this.sync('receive');
  }

  private async sync(type: string, files?: any): Promise<void> {
    this.logger.info('Sync');
    this.logger.info(type);
    let _this = this;
    if (!this.board.connected) {
      this.terminal.writeln('Please connect your device');
      return;
    }
    if (this.isIdle()) {
      this.syncObj = new Sync(this.board, this.settings, this.terminal);

      if (type === 'send') {
        this.startOperation('picowgo.upload', SYNCHRONIZING);
      } else {
        this.startOperation('picowgo.download', SYNCHRONIZING);
      }

      this.synchronizeType = type;

      // Probably needs to stay as a callback
      // Not the last thing it does.
      // eslint-disable-next-line no-unused-vars
      let cb = function (err: any) {
        _this.stopOperation();
        if (_this.board.type !== 'serial') {
          setTimeout(async function () {
            await _this.connect();
          }, 4000);
        }
      };

      if (type === 'receive') {
        await this.syncObj.startReceive(cb);
      } else {
        try {
          await this.syncObj.startSend(cb, files);
        } catch (e) {
          console.log(e);
        }
      }
    }
  }

  public async resetSoft() {
    this.board.softResetNoFollow();
  }

  public async resetHard(): Promise<void> {
    let command = 'import machine\r\nmachine.reset()\r\n';

    if (!this.board.connected) {
      this.terminal.writeln('Please connect to your device');
      return;
    }

    try {
      this.terminal.writeln('\r\nPerforming a hard reset..');
      this.outputHidden = true;
      await this.board.send(command, false);
      await Utils.sleep(1000);

      this.terminal.enter();
      await this.disconnect();
      await this.connect();
    } catch (err) {
      this.logger.error('Failed to send command: ' + command);
    }
  }

  private async stopSync(): Promise<void> {
    let _this = this;
    _this.logger.info('Stopping upload/download now...');
    if (this.isSynchronizing()) {
      let type = this.synchronizeType === 'receive' ? 'download' : 'upload';
      this.terminal.writeln('Stopping ' + type + '....');

      await this.syncObj.stop();
      this.stopOperation();
    }
  }

  private writeGetStartedText(): void {
    this.terminal.enter();
    this.terminal.write(this.config.startText);
    this.terminal.writeln('');
  }

  private async hidePanel(): Promise<void> {
    this.view.hidePanel();
    this.logger.verbose('Hiding pannel + disconnect');
    await this.disconnect();
  }

  public async toggleConnect(): Promise<void> {
    this.board.connected ? await this.disconnect() : await this.connect();
  }

  public async toggleFtp(): Promise<void> {
    if (this.isIdle()) {
      await this.ftpStart();
    } else if (this.isListeningFtp()) {
      await this.ftpStop();
    }
  }

  public async ftpStart(): Promise<void> {
    if (!this.board.connected) {
      this.terminal.writeln('Please connect your device');
      return;
    }

    let _this = this;

    this.ftpServer = new FtpSrv({
      url: 'ftp://127.0.0.1:2121',
      greeting: 'Pico FTP - welcome!',
      blacklist: ['SITE'],
    });

    if (this._fs === null || this._fs === undefined) {
      this._fs = new FtpFileSystem(this.board, this.settings, this.terminal);
    }

    // eslint-disable-next-line no-unused-vars
    this.ftpServer.on(
      'login',
      ({ connection, username, password }, resolve, reject) => {
        if (
          username !== 'pico' ||
          (username === 'pico' &&
            password !== _this.settings.get(SettingsKey.ftpPassword))
        ) {
          reject(new Error('Invalid username and password.'));
        }

        resolve({ fs: new FtpFileSystemInstance(this._fs!) });
      }
    );

    this.outputHidden = true;
    this.startOperation('picowgo.ftp', LISTENINGFTP);

    this.ftpServer.listen();
    this.terminal.enter();
    this.terminal.writeln('Started FTP server: ftp://pico@127.0.0.1:2121');
  }

  public async ftpStop() {
    if (this.ftpServer !== undefined) {
      this.ftpServer.close();

      if (this._fs) {
        await this._fs.close();
        this._fs = undefined;
      }

      this.terminal.writeln('Stopped FTP server.');
      this.outputHidden = false;
    }

    this.stopOperation();
  }

  public async checkForFirmwareUpdates() {
    if (!this.board.connected) {
      this.terminal.writeln('Please connect your device');
      return;
    }

    let board = await this.getBoardVersion();

    if (board === undefined) {
      return;
    }

    let server = await this.getServerVersion();

    try {
      if (
        semver.gte(server?.version + '.0', board?.version + '.0') &&
        server?.date !== undefined && board?.date !== undefined &&
        server?.date > board?.date
      ) {
        let choice = await this.api.confirm(
          `Firmware version v${server?.version} (${server?.date}) (unstable-${server?.numbers1}-${server?.numbers2}) is available. Would you like to download it?`,
          ['Yes', 'No']
        );

        if (choice === 'Yes' && server?.url !== undefined) {
          vscode.env.openExternal(vscode.Uri.parse(server?.url!));
        }
      } else {
        vscode.window.showInformationMessage(
          'No firmware updates are available.'
        );
      }
    } catch (err) {
      this.logger.warning(`Error processing firmware: ${err}`);
    } finally {
      this.terminal.writePrompt();
    }
  }

  public async getBoardVersion(): Promise<{
    version: string | undefined;
    date: string | undefined;
  } | undefined> {
    this.outputHidden = true;

    try {
      let response = await this.board.run(
        'import uos;print(uos.uname().version)\r\n'
      );

      if (response !== undefined) {
        this.logger.warning(response);

        let m = /v([0-9]+\.[0-9]+(\.[0-9]+)?)/.exec(response);
        let version = m?.[1];

        m = /[0-9]{4}-[0-9]{2}-[0-9]{2}/.exec(response);
        let date = m?.[0];

        return {
          version: version,
          date: date,
        };
      }
    } catch (err) {
      this.logger.warning(`Error while finding board version number: ${err}`);
    } finally {
      this.outputHidden = false;
    }
    return undefined;
  }

  public async getServerVersion(): Promise<ServerVersion|undefined> {
    try {
      let response = await fetch(
        'https://micropython.org/download/rp2-pico-w/'
      );
      let html = await response.text();

      // TODO: currently it only searches for unstable firmware as no stable version is available yet
      // TODO: change this after first stable firmware is released
      let m =
        /href="(?<url>\/resources\/firmware\/rp2-pico-w-[0-9]{8}-unstable-v[^"]+)"/gm.exec(
          html
        );
      let url = 'https://micropython.org' + m?.[1];

      m = /v([0-9]+\.[0-9]+(\.[0-9]+)?)/.exec(url);
      let version = m?.[1];

      m = /[0-9]{8}/.exec(url);
      let date = m?.[0];
      date = `${date?.substring(0, 4)}-${date?.substring(
        4,
        2
      )}-${date?.substring(6, 4)}`;

      m = /[0-9]{3}/.exec(url);
      let numbers1 = m?.[0];

      m = /[a-z0-9]{10}/.exec(url);
      let numbers2 = m?.[0];

      return {
        version: version,
        date: date,
        url: url,
        numbers1: numbers1,
        numbers2: numbers2,
      };
    } catch (err) {
      this.logger.warning(`Error while finding server version number: ${err}`);
    }
    return undefined;
  }

  public startOperation(
    stopAction: string,
    status: number,
    shownButtons = ['status', 'disconnect']
  ): void {
    this.status = status;
    this.view.startOperation(stopAction, shownButtons);
  }

  public stopOperation(): void {
    this.status = IDLE;
    this.view.stopOperation();
  }

  public isIdle(): boolean {
    return this.status === IDLE;
  }

  public isBusy(): boolean {
    return this.status !== IDLE;
  }

  public isSynchronizing(): boolean {
    return this.status === SYNCHRONIZING;
  }

  public isRunning(): boolean {
    return this.status === RUNNING;
  }

  public isListeningFtp(): boolean {
    return this.status === LISTENINGFTP;
  }
}

'use babel';

import Sync from './board/sync';
import Runner from './board/runner';
import PySerial from './connections/pyserial';
import Utils from './helpers/utils';
import ApiWrapper from './main/api-wrapper.js';
import Logger from './helpers/logger.js';
import Config from './config.js';
import EventEmitter from 'events';
import * as vscode from 'vscode';
import os from 'os';

export default class Pymakr extends EventEmitter {

  constructor(serializedState, pyboard, view, settings) {
    super();
    let _this = this;
    this.board = pyboard;
    this.synchronizing = false;
    this.synchronizeType = '';
    this.settings = settings;
    this.api = new ApiWrapper(settings);
    this.logger = new Logger('Pymakr');
    this.config = Config.constants();
    this.view = view;
    this.autoconnectTimer = null;
    this.autoconnectAddress = undefined;
    this.connectionTimer = null;
    this.utils = new Utils(settings);
    this.terminal = this.view.terminal;
    this.runner = new Runner(pyboard, this.terminal, this);
    this.outputHidden = false;

    this.settings.on('format_error', function() {
      _this.terminal.writeln('JSON format error in global pico-go.json file');
      if (_this.board.connected) {
        _this.terminal.writePrompt();
      }
    });

    this.settings.on('format_error.project', function() {
      _this.terminal.writeln(
        'JSON format error in project pico-go.json file);
      if (_this.board.connected) {
        _this.terminal.writePrompt();
      }
    });

    this.view.on('term-connected', async function(err) {
      _this.settings.setFileChangedGlobal();
      if (err) {
        _this.logger.error('Error from terminal connect:');
        _this.logger.error(err);
        _this.api.error('Unable to start the terminal');
      }
      _this.logger.info('Connected trigger from view');

      this.firstTimeStart = !await this.api.settingsExist();
      if (this.firstTimeStart) {
        this.firstTimeStart = false;
        await _this.api.openSettings();
        _this._writeGetStartedText();
      }

      // hide panel if it was hidden after last shutdown of atom
      let closeTerminal = serializedState && 'visible' in
        serializedState && !serializedState.visible;

      if (!_this.settings.open_on_start || closeTerminal) {
        await _this._hidePanel();
      }
      else {
        await _this._startAutoConnect(true);
      }
    });

    this.view.on('terminal_click', async function() {
      _this.logger.verbose('Terminal click emitted');
      if (!_this.board.connected && !_this.board.connecting) {
        _this.logger.verbose('Connecting because of terminal click');
        await _this.connect();
      }
    });

    this.view.on('user_input', function(input) {
      _this.board.sendUserInput(input)
        .catch(async err => {
          if (err && err.message == 'timeout') {
            _this.logger.warning('User input timeout, disconnecting');
            _this.logger.warning(err);
            await _this.disconnect();
          }
        });
    });

    this.on('auto_connect', async function(address) {
      if (!_this.board.connecting) {
        _this.logger.verbose(
          'Autoconnect event, disconnecting and connecting again');
        await _this.connect(address);
      }
    });

    this.board.registerStatusListener(function(status) {
      if (status == 3) {
        _this.terminal.enter();
      }
    });

    this.settings.onChange('auto_connect', async function(old_value,
      new_value) {
      _this.logger.info('auto_connect setting changed to ' + new_value);
      await _this._stopAutoConnect();
      await _this._startAutoConnect();
    });
  }

  async _startAutoConnect(wait) {
    if (this.view.visible) {
      let _this = this;
      this.logger.info('Starting autoconnect interval...');
      await this._stopAutoConnect();
      //this.terminal.writeln("AutoConnect enabled, ignoring 'address' setting (see Global Settings)")
      this.terminal.writeln('Searching for boards on serial devices...');
      if (!wait) {
        await this._setAutoconnectAddress();
      }
      this.autoconnectTimer = setInterval(async function() {
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
      this.autoconnectAddress = undefined;
    }
    if (previous != this.settings.address && (this.board.connected || this
        .board.connecting)) {
      this.logger.info('Disconnecting from previous autoconnect address');
      await this.disconnect();
    }
  }

  async _setAutoconnectAddress() {
    let address = await this._getAutoconnectAddress();

    this.logger.silly('Found address: ' + address);
    if (this.autoconnectAddress === undefined && !
      address) { // undefined means first time use
      this.terminal.writeln('No boards found on USB');
    }
    else if (address && address != this.autoconnectAddress) {
      this.logger.silly('Found a board on USB: ' + address);
      this.emit('auto_connect', address);
    }
    else if (this.autoconnectAddress && !address) {
      this.autoconnectAddress = null;
      await this.disconnect();
      this.terminal.writeln(
        '\r\nPrevious board is not available anymore');
      this.logger.silly('Previous board is not available anymore');
    }
    else if (!address) {
      this.logger.silly('No address found');
    }
    else {
      this.logger.silly('Ignoring address ' + address + ' for now');
    }

    this.autoconnectAddress = address;
  }

  async _getAutoconnectAddress() {
    if (!this.settings.auto_connect && (this.settings.manual_com_device &&
        this.settings.manual_com_device.length > 0)) {
      this.logger.silly('Manual COM port or device configured.');
      return this.settings.manual_com_device;
    }

    if (this.settings.auto_connect) {
      this.logger.silly('Autoconnect enabled');
      let result = await this._getBoard();

      let current_address = this.board.address;
      if (result.name) {
        if (!this.board.connected) {
          return result.name;
        }

        if (result.name != this.board.address) {
          if (result.list.indexOf(current_address) > -1 || !this.board
            .isSerial) {
            return result.name;
          }

          this.logger.silly(
            'already connected to a different board, or connected over telnet'
          );
          return null;
        }

        this.logger.silly(
          'already connected to the correct board');
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
        list: result.names
      };
    }

    return {
      name: null,
      manu: null,
      list: result.names
    };
  }

  async openProjectSettings() {
    try {
      await this.settings.openProjectSettings();
    }
    catch (err) {
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

  async getSerial() {
    this.terminal.enter();
    let result = await PySerial.listBoards(this.settings);

    this.terminal.writeln('Found ' + result.names.length + ' serialport' + (
      result.names.length == 1 ? '' : 's'));

    for (let i = 0; i < result.names.length; i++) {
      let name = result.names[i];
      let text = name + ' (' + result.manus[i] + ')';
      if (i == 0) {
        await this.api.writeToClipboard(name);
        text += ' (copied to clipboard)';
      }

      this.terminal.writeln(text);
    }

    this.terminal.writePrompt();
  }

  async getFullVersion() {
    let command =
      'import os; ' +
      'print("\\r\\n"); ' +
      `print("Pico-Go:      ${vscode.extensions.getExtension('chriswood.pico-go').packageJSON.version}"); ` +
      `print("VS Code:      ${vscode.version}"); ` +
      `print("Electron:     ${process.versions.electron}"); ` +
      `print("Modules:      ${process.versions.modules}"); ` +
      `print("Node:         ${process.versions.node}"); ` +
      `print("Platform:     ${os.platform()}"); ` +
      `print("Architecture: ${os.arch()}"); ` +
      'print("Board:        " + os.uname().machine); ' +
      'print("Firmware:     " + os.uname().version); ' +
      'print("\\r\\n")\r\n';

    if (!this.board.connected) {
      this.terminal.writeln('Please connect to your device');
      return;
    }

    try {
      await this.board.sendWait(command);
    }
    catch (err) {
      this.logger.error('Failed to send command: ' + command);
    }
  }

  // refresh button display based on current status
  _setButtonState() {
    this.view.setButtonState(this.runner.busy, this.synchronizing, this
      .synchronizeType);
  }

  async connect(address, clickaction) {
    this.logger.info('Connecting...');
    this.logger.info(address);

    if (this.autoconnectAddress) {
      if (!address) {
        address = this.autoconnectAddress;
        this.logger.info('Using autoconnect address: ' + address);
      }
    }
    if (this.settings.auto_connect && !address && clickaction) {
      this.terminal.writeln('AutoConnect: No device available');
    }

    let state = await this.api.getConnectionState(address);
    let ts = new Date().getTime();
    if (state && state['project'] != this.view.projectName && state[
        'timestamp'] > ts - 11000) {
      this.terminal.writeln(
        "Already connected in another window (project '" +
        state['project'] + "')");
      return;
    }

    if (!address && this.settings.auto_connect) {
      let r = await this._getAutoconnectAddress();
      this.board.setAddress(r);
      address = r;
    }
    else {
      if (address) {
        this.board.setAddress(address);
      }
    }

    // stop config observer from triggering again
    if (this.board.connected || this.board.connecting) {
      this.logger.info(
        'Still connected or connecting... disconnecting first');
      await this.disconnect();
    }

    this.board.status = 0;
    this.outputHidden = false;

    await this.board.refreshConfig();

    let connectPreamble = '';

    if (address == '' || address == null) {
      if (!this.settings.auto_connect) {
        this.terminal.writeln(
          'Address not configured. Please go to the settings to configure a valid address or comport'
        );
      }
    }
    else {
      this.terminal.writeln(connectPreamble + 'Connecting to ' +
        address + '...');

      await this.board.connect(
        address,
        this._onConnected.bind(this),
        this._onErrored.bind(this),
        this._onTimedOut.bind(this),
        this._onMessageReceived.bind(this));
    }
  }

  async _onConnected(err, address) {
    let _this = this;

    if (err) {
      this.terminal.writeln('Connection error: ' + err);
    }
    else {
      await this.api.setConnectionState(address, true, this.view
        .projectName);
      this.connectionTimer = setInterval(async function() {
        if (_this.board.connected) {
          await _this.api.setConnectionState(address, true, _this
            .view.projectName);
        }
        else {
          clearTimeout(_this.connectionTimer);
        }
      }, 10000);
    }

    this._setButtonState();
  }

  async _onErrored(err) {
    let message = this.board.getErrorMessage(err.message);
    if (message == '') {
      message = err.message ? err.message : 'Unknown error';
    }
    if (this.board.connected) {
      this.logger.warning('An error occurred: ' + message);
      if (this.synchronizing) {
        this.terminal.writeln('An error occurred: ' + message);
        this.logger.warning('Synchronizing, stopping sync');
        await this.syncObj.stop();
      }
    }
    else {
      this.terminal.writeln('> Failed to connect (' + message +
        '). Click the "Pico Disconnected" button to try again.'
      );
      this._setButtonState();
    }
  }

  // eslint-disable-next-line no-unused-vars
  _onTimedOut(err) {
    this.board.connected = false;
    this.terminal.enter();
    this.terminal.writeln(
      '> Connection timed out. Click the "Pico Disconnected" button to try again.'
    );
    this._setButtonState();
  }

  _onMessageReceived(mssg) {
    if (!this.synchronizing && !this.outputHidden) {
      this.terminal.write(mssg);
    }
  }

  async disconnect() {
    this.logger.info('Disconnecting...');

    let showMessage = false;

    if (this.board.connected)
      showMessage = true;

    if (this.board.isConnecting()) {
      this.terminal.writeln('Connection attempt cancelled');
    }

    clearInterval(this.connectionTimer);
    await this.api.setConnectionState(this.board.address, false);

    await this.board.disconnect();

    this.synchronizing = false;
    await this.runner.stop();
    this._setButtonState();

    if (showMessage)
      this.terminal.writeln('\r\nDisconnected');
  }

  async run() {
    if (!this.board.connected) {
      this.terminal.writeln('Please connect your device');
      return;
    }
    if (!this.synchronizing) {
      let code = this.api.getSelected();
      // if user has selected code, run that instead of the file
      if (code) {
        await this.runSelection();
      }
      else {
        await this.runner.toggle();
        this._setButtonState();
      }
    }
  }

  async runSelection() {
    if (!this.board.connected) {
      this.terminal.writeln('Please connect your device');
      return;
    }

    if (!this.synchronizing) {
      let code = this.api.getSelectedOrLine();

      try {
        await this.runner.selection(code);
        this.api.editorFocus();
      }
      catch (err) {
        this.logger.error('Failed to send and execute codeblock ');
      }
    }
  }

  async upload() {
    if (!this.synchronizing) {
      await this._sync('send');
    }
    else {
      await this._stopSync();
      this._setButtonState();
    }
    this._setButtonState();
  }

  async uploadFile() {
    let file = this.api.getOpenFile();

    if (!file.path) {
      this.api.warning('No file open to upload');
    }
    else {
      this.logger.info(file.path);
      await this._sync('send', file.path);
    }
  }

  async deleteAllFiles() {
    this.logger.info('Delete All Files');

    if (!this.board.connected) {
      this.terminal.writeln('Please connect your device');
      return;
    }

    let options = ['Cancel', 'Yes'];

    let choice = await this.api.confirm(
      'Are you sure you want to delete all files and directories from the board?',
      options);

    if (choice == 'Yes') {
      if (!this.synchronizing) {
        let command =
          'import os\r\n' +
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
        }
        catch (err) {
          this.logger.error(
            'Failed to send and execute codeblock ');
        }
      }
    }
  }

  async download() {
    await this._sync('receive');
  }

  async _sync(type, files) {
    this.logger.info('Sync');
    this.logger.info(type);
    let _this = this;
    if (!this.board.connected) {
      this.terminal.writeln('Please connect your device');
      return;
    }
    if (!this.synchronizing) {
      this.syncObj = new Sync(this.board, this.settings, this.terminal);
      this.synchronizing = true;
      this.synchronizeType = type;
      this._setButtonState();

      // Probably needs to stay as a callback
      // Not the last thing it does.
      // eslint-disable-next-line no-unused-vars
      let cb = function(err) {
        _this.synchronizing = false;
        _this._setButtonState();
        if (_this.board.type != 'serial') {
          setTimeout(async function() {
            await _this.connect();
          }, 4000);
        }
      };

      if (type == 'receive') {
        await this.syncObj.startReceive(cb);
      }
      else {
        try {
          await this.syncObj.startSend(cb, files);
        }
        catch (e) {
          console.log(e);
        }
      }
    }
  }

  async resetSoft() {
    this.board.softResetNoFollow();
  }

  async resetHard() {
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
    }
    catch (err) {
      this.logger.error('Failed to send command: ' + command);
    }
  }

  async _stopSync() {
    let _this = this;
    _this.logger.info('Stopping upload/download now...');
    if (this.synchronizing) {
      let type = this.synchronizeType == 'receive' ? 'download' : 'upload';
      this.terminal.writeln('Stopping ' + type + '....');

      await this.syncObj.stop();
      this.synchronizing = false;
    }
  }

  _writeGetStartedText() {
    this.terminal.enter();
    this.terminal.write(this.config.start_text);
    this.terminal.writeln('');
  }

  async _hidePanel() {
    this.view.hidePanel();
    this.logger.verbose('Hiding pannel + disconnect');
    await this.disconnect();
  }

  async toggleConnect() {
    this.board.connected ? await this.disconnect() : await this
  .connect();
  }
}
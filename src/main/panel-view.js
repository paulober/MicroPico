'use babel';

var vscode = require('vscode');
import { StatusBarAlignment, window } from 'vscode';

import Term from './terminal';
import ApiWrapper from '../main/api-wrapper.js';
import Logger from '../helpers/logger.js';

var EventEmitter = require('events');

export default class PanelView extends EventEmitter {
  constructor(pyboard, settings) {
    super();
    var _this = this;
    this.settings = settings;
    this.pyboard = pyboard;
    this.visible = true;
    this.api = new ApiWrapper();
    this.logger = new Logger('PanelView');

    this.statusItems = {};
    this.statusItems['status'] = this.createStatusItem(
      'status',
      '',
      'pymakr.toggleConnect',
      'Toggle board connection'
    ); // name is set using setTitle function
    this.statusItems['run'] = this.createStatusItem(
      'run',
      '$(triangle-right) Run',
      'pymakr.run',
      'Run current file'
    );
    this.statusItems['runselection'] = this.createStatusItem(
      'runselection',
      '$(triangle-right) Run Line',
      'pymakr.runselection',
      'Run current line'
    );
    this.statusItems['upload'] = this.createStatusItem(
      'upload',
      '$(triangle-up) Upload',
      'pymakr.upload',
      'Upload project to your board'
    );
    this.statusItems['upload_file'] = this.createStatusItem(
      'upload_file',
      '$(triangle-up) Upload file',
      'pymakr.uploadFile',
      'Upload current file to your board'
    );
    this.statusItems['download'] = this.createStatusItem(
      'download',
      '$(triangle-down) Download',
      'pymakr.download',
      'Download project from your board'
    );
    this.statusItems['disconnect'] = this.createStatusItem(
      'disconnect',
      '$(chrome-close) Disconnect',
      'pymakr.disconnect',
      'Disconnect'
    );
    this.statusItems['settings'] = this.createStatusItem(
      'settings',
      '$(gear) Settings',
      'pymakr.globalSettings',
      'Global Pico-Go settings'
    );
    this.statusItems['projectsettings'] = this.createStatusItem(
      'projectsettings',
      '$(gear) Project settings',
      'pymakr.projectSettings',
      'Project settings for Pico-Go'
    );
    this.statusItems['getversion'] = this.createStatusItem(
      'getversion',
      '$(tag) Get version',
      'pymakr.extra.getVersion',
      'Get firmware version'
    );
    // this.statusItems['getssid'] = this.createStatusItem(
    //   'getssid',
    //   '$(rss) Get WiFi SSID',
    //   'pymakr.extra.getWifiMac',
    //   'Get WiFi AP SSID'
    // );
    this.statusItems['listserial'] = this.createStatusItem(
      'listserial',
      '$(list-unordered) List serialports',
      'pymakr.extra.getSerial',
      'List available serialports'
    );
    this.statusItems['listcommands'] = this.createStatusItem(
      'listcommands',
      '$(list-unordered) All commands',
      'pymakr.listCommands',
      'List all available Pico-Go commands'
    );
    this.setTitle('not connected');
    // terminal logic
    var onTermConnect = function(err) {
      _this.emit('term-connected', err);
    };

    _this.setProjectName(_this.api.getProjectPath());

    // create terminal
    this.terminal = new Term(onTermConnect, this.pyboard, _this.settings);
    this.terminal.setOnMessageListener(function(input) {
      _this.emit('user_input', input);
    });
  }

  showQuickPick() {
    var _this = this;
    var items = [];
    items.push({ label: 'Pico-Go > Connect', description: '', cmd: 'connect' });
    items.push({
      label: 'Pico-Go > Disconnect',
      description: '',
      cmd: 'disconnect'
    });
    items.push({
      label: 'Pico-Go > Run current file',
      description: '',
      cmd: 'run'
    });
    items.push({
      label: 'Pico-Go > Run current line or selection',
      description: '',
      cmd: 'runselection'
    });
    items.push({
      label: 'Pico-Go > Upload project',
      description: '',
      cmd: 'upload'
    });
    items.push({
      label: 'Pico-Go > Upload current file only',
      description: '',
      cmd: 'upload_current_file'
    });
    items.push({
      label: 'Pico-Go > Download project',
      description: '',
      cmd: 'download'
    });
    items.push({
      label: 'Pico-Go > Delete all files from board',
      description: '',
      cmd: 'delete_all_files'
    });
    items.push({
      label: 'Pico-Go > Project settings',
      description: '',
      cmd: 'project_settings'
    });
    items.push({
      label: 'Pico-Go > Global settings',
      description: '',
      cmd: 'global_settings'
    });
    items.push({
      label: 'Pico-Go > Extra > Get firmware version',
      description: '',
      cmd: 'get_version'
    });
    // items.push({
    //   label: 'Pico-Go > Extra > Get WiFi AP SSID',
    //   description: '',
    //   cmd: 'get_wifi'
    // });
    items.push({
      label: 'Pico-Go > Extra > List serial ports',
      description: '',
      cmd: 'get_serial'
    });
    items.push({ label: 'Pico-Go > Help', description: '', cmd: 'help' });

    var options = {
      placeHolder: 'Select Action'
    };

    window.showQuickPick(items, options).then(function(selection) {
      if (typeof selection === 'undefined') {
        return;
      }
      _this.emit(selection.cmd);
    });
  }

  createStatusItem(key, name, command, tooltip) {
    if (!this.statusItemPrio) {
      this.statusItemPrio = 15;
    }
    var statusBarItem = vscode.window.createStatusBarItem(
      StatusBarAlignment.Left,
      this.statusItemPrio
    );
    statusBarItem.command = command;
    statusBarItem.text = name;
    statusBarItem.tooltip = tooltip;
    if (
      (this.settings.statusbar_buttons &&
        this.settings.statusbar_buttons.indexOf(key) > -1) ||
      key == 'listcommands'
    ) {
      statusBarItem.show();
    }
    this.statusItemPrio -= 1;
    return statusBarItem;
  }

  setProjectName(project_path) {
    if (project_path && project_path.indexOf('/') > -1) {
      this.project_name = project_path.split('/').pop();
    } else {
      this.project_name = 'No project';
    }
    this.setButtonState();
  }

  // refresh button display based on current status
  setButtonState(runner_busy, synchronizing, synchronize_type) {
    // if (!this.visible) {
    //   this.setTitle('not connected')
    // }else if(this.pyboard.connected) {
    if (this.pyboard.connected) {
      if (runner_busy == undefined) {
        // do nothing
      } else if (runner_busy) {
        this.setButton('run', 'close', 'Stop');
      } else {
        this.setButton('run', 'triangle-right', 'Run');
      }
      if (synchronizing) {
        if (synchronize_type == 'receive') {
          this.setButton('download', 'close', 'Cancel');
        } else {
          this.setButton('upload', 'close', 'Cancel');
        }
      } else {
        this.setButton('upload', 'triangle-up', 'Upload');
        this.setButton('download', 'triangle-down', 'Download');
      }

      this.setTitle('connected');
    } else {
      this.setTitle('not connected');
    }
  }

  setButton(name, icon, text) {
    this.statusItems[name].text = '$(' + icon + ') ' + text;
  }

  setTitle(status) {
    var icon = 'chrome-close';
    var title = 'Pico Disconnected'

    if (status == 'connected') {
      icon = 'check';
      title = 'Pico Connected'
    }
    
    this.setButton('status', icon, title);
  }

  // UI Stuff
  addPanel() {
    // not implemented
  }

  setPanelHeight(height) {
    // not implemented
  }

  hidePanel() {
    this.terminal.hide();
    this.visible = false;
  }

  showPanel() {
    this.terminal.clear();
    this.terminal.show();
    this.visible = true;
    this.setButtonState();
  }

  clearTerminal() {
    this.terminal.clear();
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {
    // not implemented
  }

  // Tear down any state and detach
  destroy() {
    this.disconnect();
  }

  getElement() {
    return {};
  }
}

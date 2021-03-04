'use babel';

import Config from '../config.js';
import Pyserial from '../connections/pyserial';
import Pytelnet from '../connections/pytelnet';
import Pysocket from '../connections/pysocket';
import Authorize from './authorize';
import Logger from '../helpers/logger.js';
import _ from 'lodash';

let CTRL_A = '\x01'; // raw repl
let CTRL_B = '\x02'; // exit raw repl
let CTRL_C = '\x03'; // ctrl-c
let CTRL_D = '\x04'; // reset (ctrl-d)
let CTRL_E = '\x05'; // paste mode (ctrl-e)
let CTRL_F = '\x06'; // safe boot (ctrl-f)
let CTRLS = [CTRL_A, CTRL_B, CTRL_C, CTRL_D, CTRL_E, CTRL_F];

let repl_entry_waitfor = 'raw REPL; CTRL-B to exit\r\n>';

//statuses
let DISCONNECTED = 0;
let CONNECTED=1;
let FRIENDLY_REPL = 2;
let RAW_REPL = 3;
let PASTE_MODE = 4;

export default class Pyboard {

  constructor(settings) {
    this.connected = false;
    this.connecting = false;
    this.receive_buffer = '';
    this.receive_buffer_raw = Buffer.alloc(0);
    this.waiting_for = null;
    this.waiting_for_cb = null;
    this.promise = null;
    this.waiting_for_timeout = 8000;
    this.status = DISCONNECTED;
    this.pingTimer = null;
    this.ping_count = 0;
    this.isSerial = false;
    this.type = null;
    this.settings = settings;
    this.timeout = settings.timeout;
    this.authorize = new Authorize(this);
    this.logger = new Logger('Pyboard');
    this.config = Config.constants();
    this.address = null;
  }

  async refreshConfig() {
    await this.settings.refresh();

    this.params = {
      port: 23,
      username: this.settings.username,
      password: this.settings.password,
      enpassword: '',
      timeout: this.settings.timeout,
      ctrl_c_on_connect: this.settings.ctrl_c_on_connect
    };
  }

  setAddress(address) {
    this.address = address;
  }

  _startPings(interval) {
    let _this = this;
    this.pingTimer = setInterval(async function() {
      try {
        await _this.connection.sendPing();
        _this.ping_count = 0;
      }
      catch(err) {
        _this.ping_count += 1;
      }

      if (_this.ping_count > 1) { // timeout after 2 pings
        _this.ping_count = 0;
        clearInterval(_this.pingTimer);
        _this.ontimeout(new Error('Connection lost'));
        await _this.disconnect();
      }
    }, interval * 1000);
  }

  _stopPings() {
    clearInterval(this.pingTimer);
  }

  setStatus(status) {
    if (status != this.status) {
      this.status = status;
      if (this.statusListenerCB) {
        this.statusListenerCB(status);
      }
    }
  }

  registerStatusListener(cb) {
    this.statusListenerCB = cb;
  }

  async enterFriendlyRepl() {
    await this.sendWait(CTRL_B, '\r\n>>>');
    this.setStatus(FRIENDLY_REPL);
  }

  async _enterFriendlyReplWait() {
    await this.sendWait(CTRL_B,
      'Type "help()" for more information.\r\n>>>');
    this.setStatus(FRIENDLY_REPL);
  }

  async enterFriendlyReplNonBlocking() {
    await this.send(CTRL_B);
    this.setStatus(FRIENDLY_REPL);
  }

  async _softReset(timeout) {
    if (!timeout) {
      timeout = 5000;
    }
    this.logger.info('Soft reset');
    let wait_for = this.status == RAW_REPL ? '>' : 'OK';
    return await this.sendWait(CTRL_D, wait_for, timeout);
  }

  async softResetNoFollow() {
    this.logger.info('Soft reset no follow');
    this.send(CTRL_D);
  }

  async safeBoot(timeout) {
    this.logger.info('Safe boot');
    await this.sendWait(CTRL_F,
      'Type "help()" for more information.\r\n>>>', timeout);
  }

  async _stopRunningPrograms() {
    await this.sendWait(CTRL_C, '>>>', 5000);
  }

  async stopRunningProgramsDouble(timeout) {
    await this.sendWait(CTRL_C + CTRL_C, '>>>', timeout);
  }

  async stopRunningProgramsNoFollow() {
    this.logger.info('CTRL-C (nofollow)');
    await this.send(`${CTRL_C}\r\n`);
  }

  async enterRawReplNoReset() {
    try {
      await this.flush();

      this.logger.info('Entering raw repl');

      await this.sendWait(CTRL_A, repl_entry_waitfor, 5000);

      this.setStatus(RAW_REPL);
    }
    catch (err) {
      this.promise.reject(err);
    }
  }

  isConnecting() {
    return this.connecting && !this.connected;
  }

  async connect(address, callback, onerror, ontimeout, onmessage, raw) {
    this.connecting = true;
    this.onconnect = callback;
    this.onmessage = onmessage;
    this.ontimeout = ontimeout;
    this.onerror = onerror;
    this.address = address;
    this.stopWaitingForSilent();
    await this.refreshConfig();
    this.isSerial = await Pyserial.isSerialPort(this.address);

    if (this.isSerial) {
      this.connection = new Pyserial(this.address, this.params, this
      .settings);
    }
    else if (raw) {
      this.connection = new Pysocket(this.address, this.params);
    }
    else {
      this.connection = new Pytelnet(this.address, this.params);
    }

    this.type = this.connection.type;

    if (this.connection.type == 'telnet') {
      try {
        await this.authorize.run();
        await this._onconnect(callback);
      }
      catch(error) {
        await this._disconnected();
        callback(error, this.address);
      }
    }

    let _this = this;

    await this.connection.connect(
      // onconnect
      async function() {
        _this.connection.registerListener(async function(mssg, raw) {
          await _this.receive(mssg, raw);
        });
        if (_this.connection.type != 'telnet') {
          await _this._onconnect(callback);
        }
      },
      // onerror
      async function(err) {
        await _this._disconnected();
        _this.onerror(err);
      },
      // ontimeout
      async function(mssg) {
        // Timeout callback only works properly during connect
        // after that it might trigger unneccesarily
        if (_this.isConnecting()) {
          await _this._disconnected();
          ontimeout(mssg, raw);
        }
      });
  }

  async _onconnect(cb) {
    this.setStatus(CONNECTED);
    this.connected = true;
    this.connection.connected = true;

    this.connecting = false;

    if (this.params.ctrl_c_on_connect && this.type != 'socket') {
      await this._stopRunningPrograms();
    }
    else {
      cb(null, this.address);
    }
    this._startPings(5);
  }

  async _disconnected() {
    if (this.connection) {
      await this.connection.disconnect();
    }
    this.connecting = false;
    this.connected = false;
    this._stopPings();
  }

  async reconnect() {
    let address = this.address;
    let callback = this.onconnect;
    let onerror = this.onerror;
    let ontimeout = this.ontimeout;
    let onmessage = this.onmessage;
    let raw = this.type == 'socket';

    await this.disconnect();
    await this.connect(address, callback, onerror, ontimeout, onmessage, raw);
  }

  _getWaitType() {
    let type = Object.prototype.toString.call(this.waiting_for);

    switch (type) {
      case '[object RegExp]':
        return 'regex';
      case '[object String]':
        return 'literal';
      case '[object Number]':
        return 'length';
      default:
        throw new Error('Unknown wait type');
    }
  }

  _isFriendlyLiteralWaitMatch(buffer) {
    if (
      this._getWaitType() == 'literal' &&
      this.status != RAW_REPL &&
      buffer.indexOf(this.waiting_for) > -1 &&
      buffer.indexOf('>>> ') > -1
    )
      return true;

    return false;
  }

  _isRawLiteralWaitMatch(buffer) {
    if (
      this._getWaitType() == 'literal' &&
      (this.status == RAW_REPL || buffer.indexOf(repl_entry_waitfor) > -1) &&
      buffer.indexOf(this.waiting_for) > -1
    )
      return true;

    return false;
  }

  _isRegexWaitMatch(buffer) {
    if (
      this._getWaitType() == 'regex' &&
      this.waiting_for.test(buffer)
    )
      return true;

    return false;
  }

  async receive(mssg, raw) {
    this.logger.silly('Received message: ' + mssg);
    if (!this.wait_for_block && typeof mssg != 'object' && this.onmessage !=
      undefined) {
      this.onmessage(mssg);
    }
    let err_in_output = this.getErrorMessage(mssg);

    this.receive_buffer += mssg;
    this.receive_buffer_raw = Buffer.concat([this.receive_buffer_raw, raw]);

    if (this.receive_buffer.length > 80000) {
      this.receive_buffer = this.receive_buffer.substr(40000);
    }

    if (this.receive_buffer_raw.length > 80000) {
      this.receive_buffer_raw = this.receive_buffer_raw.slice(40000);
    }

    this.logger.silly('Buffer length now ' + this.receive_buffer.length);

    if (err_in_output != '') {
      this.logger.silly('Error in output: ' + err_in_output);
      let err = new Error(err_in_output);
      if (this.waiting_for != null) {
        this._stopWaitingFor(this.receive_buffer, this.receive_buffer_raw,
          err);
      }
      else {
        this.onerror(err);
      }

    }
    else if (this.waiting_for != null && mssg) {
      this.logger.silly('Waiting for ' + this.waiting_for);

      if (this.receive_buffer === undefined) this.receive_buffer = '';

      if (this.receive_buffer.indexOf('Invalid credentials, try again.') > -
        1) {
        await this._disconnected();
        this.onconnect('Invalid credentials');
        this.stopWaitingForSilent();
        this.waitForBlocking('Login as:', function() {
          // do nothing
        });
      }

      if (this._getWaitType() == 'length') {
        this.logger.silly('Waiting for ' + this.waiting_for + ', got ' + this
          .receive_buffer.length + ' so far');
        if (this.receive_buffer.length >= this.waiting_for) {
          this._stopWaitingFor(this.receive_buffer, this.receive_buffer_raw);
        }
      }
      else if (
        this._isFriendlyLiteralWaitMatch(this.receive_buffer) ||
        this._isFriendlyLiteralWaitMatch(this.receive_buffer_raw) ||
        this._isRegexWaitMatch(this.receive_buffer) ||
        this._isRegexWaitMatch(this.receive_buffer_raw)
      ) {
        let trail = this.receive_buffer.split(this.waiting_for).pop(-1);
        if (trail && trail.length > 0 && this.wait_for_block) {
          this.onmessage(trail);
        }
        this._stopWaitingFor(this.receive_buffer, this.receive_buffer_raw);
      }
      else if (
        this._isRawLiteralWaitMatch(this.receive_buffer) ||
        this._isRawLiteralWaitMatch(this.receive_buffer_raw)
      ) {
        let content = this.receive_buffer;

        if (content.indexOf(repl_entry_waitfor) > -1)
          content = '';

        if (content.startsWith('OK'))
          content = content.substr(2);

        if (content.endsWith('>')) {
          content = content.substr(0, content.length - 1);
        }

        if (content.length > 0 && this.wait_for_block) {
          this.onmessage(content);
        }
        this._stopWaitingFor(this.receive_buffer, this.receive_buffer_raw);
      }
    }
  }

  stopWaitingForSilent() {
    let promise = this.promise;

    clearTimeout(this.waiting_for_timer);
    this.waiting_for = null;
    this.wait_for_block = false;
    this.promise = null;

    return promise;
  }

  _stopWaitingFor(msg, raw, err) {
    this.logger.silly('Stopping waiting for, got message of ' + msg.length +
      ' chars');

    let promise = this.stopWaitingForSilent();

    if (promise) {
      // This is a promise-based command.
      if (err) {
        promise.reject(err);
      }
      else {
        promise.resolve({
          msg: msg,
          raw: raw
        });
      }
    }
    else if (this.waiting_for_cb) {
      // This is an olds-school callback.
      this.waiting_for_cb(err, msg, raw);
    }
    else {
      this.logger.silly('No callback after waiting');
    }
  }

  async disconnect() {
    await this.disconnectSilent();
    this.setStatus(DISCONNECTED);
  }

  async disconnectSilent() {
    await this._disconnected();
  }

  async run(code) {
    let alreadyRaw = this.status == RAW_REPL;

    await this._stopRunningPrograms();

    if (!alreadyRaw) {
      await this.enterRawReplNoReset();
    }

    // executing code delayed (20ms) to make sure _this.wait_for(">") is executed before execution is complete
    code += '\r\nimport time';
    code += '\r\ntime.sleep(0.1)';

    let response = await this.sendWait(code);

    if (!alreadyRaw) {
      await this._enterFriendlyReplWait();
    }

    return response;
  }

  async sendUserInput(msg) {
    await this.send(msg);

    if (msg == CTRL_A) {
      this.status = RAW_REPL;
    }
    else if (msg == CTRL_B) {
      this.status = FRIENDLY_REPL;
    }
    else if (msg == CTRL_E) {
      this.status = PASTE_MODE;
    }
  }

  waitForBlocking(wait_for, promise, timeout) {
    this.waitFor(wait_for, promise, timeout);
    this.wait_for_block = true;
  }

  waitFor(wait_for, promise, timeout, clear = true) {
    this.wait_for_block = false;
    this.waiting_for = wait_for;
    this.promise = promise;
    this.waiting_for_timeout = timeout;
    if (clear) {
      this.receive_buffer = '';
      this.receive_buffer_raw = Buffer(0);
    }

    let _this = this;
    clearTimeout(this.waiting_for_timer);
    if (timeout) {
      this.waiting_for_timer = setTimeout(function() {
        if (_this.waiting_for_cb) {
          let temp = _this.promise;
          _this.waiting_for_cb = null;
          _this.promise = null;
          _this.wait_for_block = false;
          _this.waiting_for = null;
          _this.receive_buffer = '';
          _this.receive_buffer_raw = Buffer(0);
          temp.reject(new Error('timeout'), _this.receive_buffer);
        }
      }, timeout);
    }
  }

  async send(command, drain=true) {
    if (this.connection)
      await this.connection.send(command, drain);
  }

  async sendWait(command, waitFor = null, timeout = 5000) {
    let _this = this;
    let result = null; 

    if (!waitFor)
       waitFor = this.status == RAW_REPL ? '>' : command;

    if (!_.includes(CTRLS, command) && !command.endsWith('\r\n'))
      command += '\r\n';

    // If we're waiting for a response, we need to
    // run the commands we've sent if we're in 
    // raw REPL. Only do this if we're not exiting raw
    // REPL, though.
    if (this.status == RAW_REPL && !command.endsWith(CTRL_D) && command != CTRL_B)
      command += CTRL_D;

    let promise = new Promise((resolve, reject) => {
      this.waitForBlocking(
        waitFor, {
          resolve: resolve,
          reject: reject
        },
        timeout);

      _this.send(command);
    });

    result = await promise;
    let received = result.msg;

    if (this.status == RAW_REPL) {
      if (received.startsWith('OK'))
        received = received.substr(2);

      // EOT - End of Transmission ASCII character.
      if (received.indexOf('\u0004') >= 0)
        received = received.substr(0, received.indexOf('\u0004'));
    }
    else {
      if (received.startsWith(command)) {
        received = received.substr(command.length);
      }

      if (received.endsWith('>>> '))
        received = received.substr(0, received.length - 4);
    }


    return received;
  }

  async _execRawNoReset(code) {
    this.logger.verbose('Executing code:' + code);
    return await this.sendWait(code);
  }

  async flush() {
    if (this.connection) {
      await this.connection.flush();
    }
  }

  getErrorMessage(text) {
    let messages = this.config.error_messages;
    for (let key in messages) {
      if (text.indexOf(key) > -1) {
        return messages[key];
      }
    }
    return '';
  }
}
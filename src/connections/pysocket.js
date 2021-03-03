'use babel';

import * as util from 'util';
import { Socket } from 'net';

export default class PySocket {

  constructor(address, params) {
    this.type = 'socket';

    let stream = new Socket();
    this.stream = stream;

    this.stream.setTimeout(params.timeout);
    this.connected = false;
    this.params = params;
    this.address = address;
    this.receiveBuffer = '';
    this.onErrorCalled = false;

    this._stream_destroy = util.promisify(stream.destroy).bind(stream);
    this._stream_write = util.promisify(stream.write).bind(stream);
  }

  connect(onconnect, onerror, ontimeout) {
    this.onconnect = onconnect;
    this.onerror = onerror;
    this.ontimeout = ontimeout;
    this.usernameSent = false;
    this.passwordSent = false;
    let _this = this;
    this.stream.connect(this.params.port, this.address);
    this.stream.on('connect', function() {
      onconnect();
    });
    this.stream.on('timeout', function() {
      ontimeout();
    });
    this.stream.on('error', function(error) {
      if (!_this.onErrorCalled) {
        _this.onErrorCalled = true;
        onerror(error);
      }
    });
    this.stream.on('close', function(hadError) {
      if (hadError && !_this.onErrorCalled) {
        _this.onErrorCalled = true;
        onerror();
      }
    });
    this.stream.on('end', function() {
      if (!_this.onErrorCalled) {
        _this.onErrorCalled = true;
      }
    });
  }

  async disconnect() {
    await this._stream_destroy();
    this.stream = null;
  }

  registerListener(cb) {
    this.onmessage = cb;
    this.stream.on('data', function(data) {
      let raw = Buffer(data);
      cb(data, raw);
    });
  }

  async send(msg) {
    msg = msg.replace('\x1b', '\x1b\x1b');
    let data = Buffer.from(msg, 'binary');

    if (this.stream) {
      await this._stream_write(data);
    }
    else {
      throw new Error('Not connected');
    }
  }

  async sendPing() {
    return true;
  }

  async flush() {}
}
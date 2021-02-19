'use babel';

import * as util from 'util';
import TelnetClient from './telnet/telnetcli.js';

let AYT = '\xff\xf6';

export default class PyTelnet {

  constructor(address, params) {
    this.type = 'telnet';

    let stream = new TelnetClient('pycomboard');
    this.stream = stream;
    
    this.connected = false;
    this.listening = false;
    this.usernameSent = false;
    this.passwordSent = false;
    this.params = params;
    this.address = address;
    this.pingTimer = null;
    this.receiveBuffer = '';
    this.aytPending = false;

    this._stream_write = util.promisify(stream.write).bind(stream);
  }

  sendPing(cb) {
    this.sendPingAsync()
    .then(() => {
      if (cb) cb();
      return true;
    })
    .catch(err => {
      if (cb) cb(err);
      return false;
    });
  }

  async sendPingAsync() {
    if (this.aytPending) {
      this.aytPending = false;
      throw new Error('Ping failed');
    }
    this.aytPending = true;
    await this.sendAsync(AYT);
    return true;
  }

  connect(onconnect, onerror, ontimeout) {
    this.onconnect = onconnect;
    this.onerror = onerror;
    this.ontimeout = ontimeout;
    this.usernameSent = false;
    this.passwordSent = false;
    let _this = this;
    this.params.host = this.address;
    this.stream.connect(this.params, function(err) {
      onconnect(new Error(err));
    });
    this.stream.setReportErrorHandler(function(telnet, error) {
      if (onerror) {
        if (!error) {
          error = 'Connection lost';
        }
        onerror(new Error(error));
      }
    });

    let timeoutTriggered = false;
    this.stream.setReportTimeoutHandler(function(telnet, error) {
      if (ontimeout) {
        if (!timeoutTriggered) {
          timeoutTriggered = true;
          ontimeout(error);
        }
      }
    });

    // eslint-disable-next-line no-unused-vars
    this.stream.setReportAYTHandler(function(telnetcli, type) {
      _this.aytPending = false;
    });
  }

  disconnect(cb) {
    this.disconnectAsync()
      .then(cb);
  }

  async disconnectAsync() {
    this.stream.close();
    // give the connection time to close.
    // there is no proper callback for this in the telnet lib.
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  registerListener(cb) {
    this.onmessage = cb;

    this.stream.read(function(err, recv) {
      if (recv) {
        let data = recv.join('');
        let raw = Buffer(recv);
        cb(data, raw);
      }
    });
  }

  send(msg, cb) {
    this.sendAsync(msg)
      .then(() => {
        if (cb) cb();
      })
      .catch(err => {
        if (cb) cb(err);
      });
  }

  async sendAsync(msg) {
    let data = Buffer.from(msg, 'binary');
    await this.sendRawAsync(data);
  }

  send_raw(data, cb) {
    this.sendRawAsync(data)
      .then(() => {
        if (cb) cb();
      })
      .catch(err => {
        if (cb) cb(err);
      });
  }

  async sendRawAsync(data) {
    await this._stream_write(data);
  }

  send_cmd(cmd, cb) {
    this.sendCmdAsync(cmd)
      .then(() => {
        if (cb) cb();
      })
      .catch(err => {
        if (cb) cb(err);
      });
  }

  async sendCmdAsync(cmd) {
    let mssg = '\x1b\x1b' + cmd;
    let data = Buffer.from(mssg, 'binary');
    await this.sendRawAsync(data);
  }

  flush(cb) {
    cb();
  }

  async flushAsync() {}
}
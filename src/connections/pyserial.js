'use babel';

import * as util from 'util'
import Logger from '../helpers/logger.js';
import { promises as fs, constants as fsConstants } from 'fs';
import SerialPort from 'serialport'

export default class PySerial {
  constructor(address, params, settings) {
    this.type = 'serial';
    this.params = params;
    this.address = address;
    this.aytPending = false;
    this.logger = new Logger('PySerial');

    let _this = this;

    let stream = new SerialPort(
      address, {
        baudRate: 115200,
        autoOpen: false
      },
      function(err) {
        _this.logger.warning('Failed to connect to SerialPort');
        _this.logger.warning(err);
      }
    );

    this.stream = stream;

    this._stream_open = util.promisify(stream.open).bind(stream);
    this._stream_set = util.promisify(stream.set).bind(stream);
    this._stream_write = util.promisify(stream.write).bind(stream);
    this._stream_drain = util.promisify(stream.drain).bind(stream);
    this._stream_close = util.promisify(stream.close).bind(stream);
    this._stream_flush = util.promisify(stream.flush).bind(stream);

    this.manufacturers = settings.autoconnect_comport_manufacturers;
    this.dtrSupported = ['darwin'].indexOf(process.platform) > -1;
  }

  connect(onconnect, onerror, ontimeout) {
    this.connectAsync(onconnect, onerror, ontimeout)
      .catch(err =>
        console.log(err));
  }

  async connectAsync(onconnect, onerror, ontimeout) {
    let _this = this;
    let isErrorThrown = false;

    let timeout = setTimeout(function() {
      if (!isErrorThrown) {
        isErrorThrown = true;
        ontimeout(new Error('Timeout while connecting'));
        _this.disconnect();
      }
    }, _this.params.timeout);

    console.log('Trying to open stream');

    // open errors will be emitted as an error event
    this.stream.on('error', function(err) {
      if (!isErrorThrown) {
        isErrorThrown = true;
        onerror(new Error(err));
      }
    });

    await this._stream_open();
    await this.sendPingAsync();

    // Got this far, so clear the timeout
    clearTimeout(timeout);

    await this.sendAsync("\r\n");
    onconnect();
  }

  disconnect(cb = null) {
    this.disconnectAsync()
      .then(() => {
        if (cb) cb();
      })
      .catch(err => {
        if (cb) cb(err);
      });
  }

  async disconnectAsync() {
    await this._stream_close();
  }

  registerListener(cb) {
    let _this = this;
    this.onmessage = cb;
    this.stream.on('data', function(data) {
      let data_str = data.toString();
      data = Buffer(data);
      _this.onmessage(data_str, data);
    });
  }

  send(mssg, cb) {
    this.sendAsync(mssg, cb != undefined)
      .then(() => {
        if (cb) cb();
      })
      .catch(err => {
        if (cb) cb(err);
      });
  }

  async sendAsync(mssg, drain = true) {
    let data = Buffer.from(mssg, 'binary');
    await this.sendRawAsync(data, drain);
  }

  send_raw(data, cb) {
    this.sendRawAsync(data, cb != undefined)
      .then(() => {
        if (cb) cb();
      })
      .catch(err => {
        if (cb) cb(err);
      });
  }

  async sendRawAsync(data, drain = true) {
    await this._stream_write(data);

    if (drain)
      await this._stream_drain();
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
    let msg = '\x1b\x1b' + cmd;
    let data = Buffer.from(msg, 'binary');
    await this.sendRawAsync(data);
  }

  static isSerialPort(name, cb) {
    this.isSerialPortAsync(name)
      .then(result => {
        cb(result);
      });
  }

  static async isSerialPortAsync(name) {
    if (name && (name.substr(0, 3) == 'COM' || name.indexOf('tty') > -1 ||
        name.indexOf('/dev') > -1)) {
      return true;
    }
    else {
      try {
        await fs.access(name, fsConstants.F_OK);
        return true;
      }
      catch (err) {
        return false;
      }
    }
  }

  static listPycom(settings, cb) {
    PySerial.listTargetBoardsAsync(settings)
      .then(r => {
        cb(r.names, r.manus);
      });
  }

  static async listTargetBoardsAsync(settings) {
    // returns { names: [], manus: [] }
    let names = [];
    let manus = [];

    settings.refresh();

    let manufacturers = settings.autoconnect_comport_manufacturers;
    let listResult = await PySerial.listBoardsAsync(settings);

    for (let i = 0; i < listResult.names.length; i++) {
      let name = listResult.names[i];
      let manu = listResult.manus[i];
      if (manufacturers.indexOf(manu) > -1) {
        names.push(name);
        manus.push(manu);
      }
    }

    return {
      names: names,
      manus: manus
    };
  }

  static list(settings, cb) {
    PySerial.listBoardsAsync(settings)
      .then(r => {
        cb(r.names, r.manus);
      });
  }

  static async listBoardsAsync(settings) {
    // returns { names: [], manus: [] }
    let targetManufacturers = settings.autoconnect_comport_manufacturers;
    let ports = await SerialPort.list();

    let portnames = [];
    let otherPortnames = [];
    let manufacturers = [];
    let otherManufacturers = [];

    // eslint-disable-next-line no-unused-vars
    ports.forEach((port, index, array) => {
      let name = port.path;

      if (!!name) {
        if (name.indexOf('Bluetooth') == -1) {
          // use vendorId if manufacturer string is null
          let manu = port.manufacturer ? port.manufacturer : port
            .vendorId ? port.vendorId : 'Unknown manufacturer';
          let targetIndex = targetManufacturers.indexOf(manu);

          if (targetIndex > -1) {
            let j;
            for (j = 0; j < manufacturers.length; j++) {
              if (targetIndex < targetManufacturers.indexOf(manufacturers[
                  j])) {
                break;
              }
            }

            portnames.splice(j, 0, name);
            manufacturers.splice(j, 0, manu);
          }
          else {
            otherPortnames.push(name);
            otherManufacturers.push(manu);
          }
        }
      }
    });

    return {
      names: portnames.concat(otherPortnames),
      manus: manufacturers.concat(otherManufacturers)
    };
  }

  sendPing(cb) {
    this.sendPingAsync()
      .then(() => {
        cb();
        return true;
      })
      .catch(err => {
        cb(err);
        return false;
      });
  }

  async sendPingAsync() {
    if (process.platform == 'win32') {
      // avoid MCU waiting in bootloader on hardware restart by setting both dtr and rts high
      await this._stream_set({
        rts: true
      });
    }

    if (this.dtrSupported) {
      let err = await this._stream_set({
        dtr: true
      });
      if (err) throw err;
    }
  }

  flush(cb) {
    this.flushAsync()
      .then(r => {
        cb(r);
      });
  }

  async flushAsync() {
    return await this._stream_flush();
  }
}
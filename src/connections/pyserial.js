'use babel';

const util = require('util');
import Logger from '../helpers/logger.js';
var fs = require('fs');

var SerialPort = require('serialport');
console.log('Serialport included without issues');

export default class PySerial {
  // 'Microsoft' and 'Microchip Technology, Inc.' manufacturers show on boards with a PIC on windows
  constructor(address, params, settings) {
    this.type = 'serial';
    this.params = params;
    this.address = address;
    this.ayt_pending = false;
    this.logger = new Logger('PySerial');
    var _this = this;
    
    var stream = new SerialPort(
      address,
      {
        baudRate: 115200,
        autoOpen: false
      },
      function(err) {
        _this.logger.warning('Failed to connect to SerialPort');
        _this.logger.warning(err);
        // not implemented
      }
    );

    this.stream = stream;

    this._stream_open = util.promisify(stream.open).bind(stream);
    this._stream_set = util.promisify(stream.set).bind(stream);
    this._stream_write = util.promisify(stream.write).bind(stream);
    this._stream_drain = util.promisify(stream.drain).bind(stream);
    this._stream_close = util.promisify(stream.close).bind(stream);
    this._stream_flush = util.promisify(stream.flush).bind(stream);

    this.comport_manufacturers = settings.autoconnect_comport_manufacturers;

    var dtr_support = ['darwin'];

    this.dtr_supported = dtr_support.indexOf(process.platform) > -1;
  }

  connect(onconnect, onerror, ontimeout) {
    this.connectAsync(onconnect, onerror, ontimeout)
      .catch(err => 
        console.log(err));
  }

  async connectAsync(onconnect, onerror, ontimeout) {
    var _this = this;
    var error_thrown = false;

    var timeout = setTimeout(function() {
      if (!error_thrown) {
        error_thrown = true;
        ontimeout(new Error('Timeout while connecting'));
        _this.disconnect();
      }
    }, _this.params.timeout);

    console.log('Trying to open stream');

    // open errors will be emitted as an error event
    this.stream.on('error', function(err) {
      if (!error_thrown) {
        error_thrown = true;
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
    var _this = this;
    this.onmessage = cb;
    this.stream.on('data', function(data) {
      var data_str = data.toString();
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
    var data = Buffer.from(mssg, 'binary');
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
    var mssg = '\x1b\x1b' + cmd;
    var data = Buffer.from(mssg, 'binary');
    await this.sendRawAsync(data);
  }

  static isSerialPort(name, cb) {
    this.isSerialPortAsync(name)
      .then(result => {
        cb(result);
      });
  }

  static async isSerialPortAsync(name) {
    if (name && (name.substr(0, 3) == 'COM' || name.indexOf('tty') > -1 || name.indexOf('/dev') > -1)) {
      return true;
    } 
    else {
      try {
        await PySerial._fs_access(name, fs.constants.F_OK);
        return true;
      }
      catch(err) {
        return false;
      }

    }
  }

  static listPycom(settings, cb) {
    PySerial.listPycomAsync(settings)
      .then(r => {
        cb(r.names, r.manus);
      });
  }

  static async listPycomAsync(settings) {
    // returns { names: [], manus: [] }
    var pycom_list = [];
    var pycom_manus = [];

    settings.refresh();

    var comport_manufacturers = settings.autoconnect_comport_manufacturers;
    var listResult = await PySerial.listAsync(settings);

    for (var i = 0; i < listResult.names.length; i++) {
      var name = listResult.names[i];
      var manu = listResult.manus[i];
      if (comport_manufacturers.indexOf(manu) > -1) {
        pycom_list.push(name);
        pycom_manus.push(manu);
      }
    }

    return {
      names: pycom_list,
      manus: pycom_manus
    };
  }

  static list(settings, cb) {
    PySerial.listAsync(settings)
      .then(r => {
        cb(r.names, r.manus);
      });
  }

  static async listAsync(settings, cb) {
    // returns { names: [], manus: [] }
    var comport_manufacturers = settings.autoconnect_comport_manufacturers;
    var ports = await SerialPort.list();

    var portnames = [];
    var other_portnames = [];
    var manufacturers = [];
    var other_manufacturers = [];

    ports.forEach((port, index, array) => {
      var name = port.path;
      if (!!name) {
        if (name.indexOf('Bluetooth') == -1) {
          // use vendorId if manufacturer string is null
          var manu = port.manufacturer ? port.manufacturer : port.vendorId ? port.vendorId : 'Unknown manufacturer';
          var pycom_manu_index = comport_manufacturers.indexOf(manu);
          if (pycom_manu_index > -1) {
            var j;
            for (j = 0; j < manufacturers.length; j++) {
              if (pycom_manu_index < comport_manufacturers.indexOf(manufacturers[j])) {
                break;
              }
            }
            portnames.splice(j, 0, name);
            manufacturers.splice(j, 0, manu);
          }
        } else {
          other_portnames.push(name);
          other_manufacturers.push(manu); // push to top of array
        }
      }
    });
    var names = portnames.concat(other_portnames);
    var manus = manufacturers.concat(other_manufacturers);
    
    return {
      names: names,
      manus: manus
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
    // void
    if (process.platform == 'win32') {
      // avoid MCU waiting in bootloader on hardware restart by setting both dtr and rts high
      await this._stream_set({ rts: true });
    }
    // not implemented
    if (this.dtr_supported) {
      let err = await this._stream_set({ dtr: true});
      
      if (err)
        throw err;
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

PySerial._fs_access = util.promisify(fs.access);
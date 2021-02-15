'use babel';

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
    this.stream = new SerialPort(
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

    this.comport_manufacturers = settings.autoconnect_comport_manufacturers;

    var dtr_support = ['darwin'];

    this.dtr_supported = dtr_support.indexOf(process.platform) > -1;
  }

  connect(onconnect, onerror, ontimeout) {
    var _this = this;
    var error_thrown = false;

    // open errors will be emitted as an error event
    this.stream.on('error', function(err) {
      if (!error_thrown) {
        error_thrown = true;
        onerror(new Error(err));
      }
    });

    var timeout = null;
    console.log('Trying to open stream');
    this.stream.open(function() {
      _this.sendPing(function(err) {
        if (!err) {
          clearTimeout(timeout);
          _this.send('\r\n', function() {
            onconnect();
          });
        }
      });
    });

    timeout = setTimeout(function() {
      if (!error_thrown) {
        error_thrown = true;
        ontimeout(new Error('Timeout while connecting'));
        _this.disconnect(function() {});
      }
    }, _this.params.timeout);
  }

  disconnect(cb) {
    this.stream.close();
    cb();
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
    var data = Buffer.from(mssg, 'binary');
    this.send_raw(data, cb);
  }

  send_raw(data, cb) {
    var _this = this;
    var r = false;
    this.stream.write(data, function() {
      if (cb) {
        r = true;
        _this.stream.drain(cb);
      }
    });
  }

  send_cmd(cmd, cb) {
    var mssg = '\x1b\x1b' + cmd;
    var data = Buffer.from(mssg, 'binary');
    this.send_raw(data, function() {
      // setTimeout(cb,400)
      cb();
    });
  }

  static isSerialPort(name, cb) {
    if (name && (name.substr(0, 3) == 'COM' || name.indexOf('tty') > -1 || name.indexOf('/dev') > -1)) {
      cb(true);
    } else {
      fs.access(name, fs.constants.F_OK, function(err) {
        if (err == true) {
          cb(true);
        } else {
          cb(false);
        }
      });
    }
  }

  static listPycom(settings, cb) {
    var pycom_list = [];
    var pycom_manus = [];
    settings.refresh();
    var comport_manufacturers = settings.autoconnect_comport_manufacturers;
    PySerial.list(settings, function(names, manus) {
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        var manu = manus[i];
        if (comport_manufacturers.indexOf(manu) > -1) {
          pycom_list.push(name);
          pycom_manus.push(manu);
        }
      }
      cb(pycom_list, pycom_manus);
    });
  }

  static list(settings, cb) {
    var comport_manufacturers = settings.autoconnect_comport_manufacturers;
    SerialPort.list().then(ports => {
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
              // if(PySerial.COMPORT_MANUFACTURERS[0] == manu){
              //   portnames.unshift(name) // push to top of array
              //   manufacurers.unshift(manu) // push to top of array
              // }else{
              //   portnames.push(name)
              //   manufacurers.push(manu) // push to top of array
              // }
            }
          } else {
            other_portnames.push(name);
            other_manufacturers.push(manu); // push to top of array
          }
        }
      });
      var result = portnames.concat(other_portnames);
      var manus = manufacturers.concat(other_manufacturers);
      cb(result, manus);
    });
  }

  sendPing(cb) {
    if (process.platform == 'win32') {
      // avoid MCU waiting in bootloader on hardware restart by setting both dtr and rts high
      this.stream.set({ rts: true });
    }
    // not implemented
    if (this.dtr_supported) {
      this.stream.set({ dtr: true }, function(err) {
        if (cb) {
          cb(err);
          return err ? false : true;
        }
      });
    } else {
      cb();
      return true;
    }
  }

  flush(cb) {
    this.stream.flush(cb);
  }
}

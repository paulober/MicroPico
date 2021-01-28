'use babel';

var Socket = require('net').Socket;

export default class PySocket {

  constructor(address,params){
    this.type = "socket"
    this.stream = new Socket();

    this.stream.setTimeout(params.timeout)
    this.connected = false
    this.params = params
    this.address = address
    this.receive_buffer = ""
    this.on_error_called = false
  }

  connect(onconnect,onerror,ontimeout){

    this.onconnect = onconnect
    this.onerror = onerror
    this.ontimeout = ontimeout
    this.username_sent = false
    this.password_sent = false
    var _this = this
    this.stream.connect(this.params.port,this.address);
    this.stream.on('connect', function () {
        onconnect()
    });
    this.stream.on('timeout', function () {
        ontimeout()
    });
    this.stream.on('error', function (error) {
      if(!_this.on_error_called){
        _this.on_error_called = true
        onerror(error)
      }
    });
    this.stream.on('close', function (had_error) {
        if(had_error && !_this.on_error_called){
          _this.on_error_called = true
          onerror()
        }
    });
    this.stream.on('end', function () {
        if(!_this.on_error_called){
          _this.on_error_called = true
        }
    });
  }

  disconnect(cb){
    if(this.stream){
      this.stream.destroy();
      this.stream = null;
    }
    cb()
  }

  registerListener(cb){
    this.onmessage = cb
    this.stream.on('data', function (data) {
        var raw = Buffer(data)
        cb(data,raw)
    });
  }

  send(mssg,cb){
    mssg = mssg.replace('\x1b', '\x1b\x1b')
    var data = Buffer.from(mssg,"binary")
    this.send_raw(data,cb)
  }

  send_raw(data,cb){
    if(this.stream){
      this.stream.write(data,function(){
        if(cb) cb();
      })
    }else{
      cb(new Error("Not connected"))
    }
  }

  send_cmd(cmd,cb){
    var mssg = '\x1b\x1b' + cmd
    var data = Buffer.from(mssg,"binary")
    this.send_raw(data,cb)
  }

  sendPing(cb){
    if(cb) cb(null)
    return true
  }

  flush(cb){
    cb()
  }
}

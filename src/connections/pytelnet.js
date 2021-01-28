'use babel';

import TelnetClient from './telnet/telnetcli.js';

var AYT = '\xff\xf6'

export default class PyTelnet {

  constructor(address,params){
    this.type = "telnet"
    this.stream = new TelnetClient('pycomboard');
    this.connected = false
    this.listening = false
    this.username_sent = false
    this.password_sent = false
    this.params = params
    this.address = address
    this.pingTimer = null
    this.receive_buffer = ""
    this.ayt_pending = false

  }

  sendPing(cb){
    if(this.ayt_pending){
      this.ayt_pending = false
      cb(new Error("Ping failed"))
      return false
    }
    this.ayt_pending = true
    this.send(AYT)
    cb(null)
    return true
  }

  connect(onconnect,onerror,ontimeout){
    this.onconnect = onconnect
    this.onerror = onerror
    this.ontimeout = ontimeout
    this.username_sent = false
    this.password_sent = false
    var _this = this
    this.params.host = this.address
    this.stream.connect(this.params,function(err){
      onconnect(new Error(err))
    });
    this.stream.setReportErrorHandler(function(telnet,error){
      if(onerror){
        if (!error) {
          error = "Connection lost"
        }
        onerror(new Error(error))
      }
    })

    var timeout_triggered = false
    this.stream.setReportTimeoutHandler(function(telnet,error){
      if(ontimeout){
        if(!timeout_triggered){
          timeout_triggered = true
          ontimeout(error)
        }

      }
    })

    this.stream.setReportAYTHandler(function(telnetcli,type){
      _this.ayt_pending = false
    })
  }

  disconnect(cb){
    this.stream.close()
    // give the connection time to close.
    // there is no proper callback for this in the telnet lib.
    setTimeout(cb,200)
  }

  registerListener(cb){
    this.onmessage = cb

    this.stream.read(function(err,recv){
      if(recv){
        var data=recv.join('');
        var raw = Buffer(recv)
        cb(data,raw)
      }
    });
  }

  send(mssg,cb){
    var data = Buffer.from(mssg,"binary")
    this.send_raw(data,cb)
  }

  send_raw(data,cb){
    this.stream.write(data,function(){
      if(cb) cb()
    })
  }

  send_cmd(cmd,cb){
    var mssg = '\x1b\x1b' + cmd
    var data = Buffer.from(mssg,"binary")
    this.send_raw(data,cb)
  }

  flush(cb){
    cb()
  }
}

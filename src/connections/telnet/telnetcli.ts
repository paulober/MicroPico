// From: https://www.npmjs.com/package/telnetit

import Telnet from './utilTelnet';
var format = require('./format');
var extend = require('util')._extend;

function noop() {}

export default class TelnetClient {
  private name: string;

  private config: any;
  private c: Telnet;
  private connectState: boolean;
  private connecting: boolean;
  private svrReplyList: any[];
  private svrReplyWatchers: any[];
  private connectCallback: Function|null;
  private reportErrorHandler: Function|null;
  private reportEndHandler: Function|null;
  private reportTimeoutHandler: Function|null;
  private reportAYTHandler: Function|null;

  constructor(name: string) {
    this.name = name;

    this.config = null;
    this.c = new Telnet();
    this.connectState = false; // is connected?
    this.connecting = false; // is connecting?
    this.svrReplyList = []; // contain the income message which haven't been read.
    this.svrReplyWatchers = []; // contain the reader ,who want to read but no message exists.
    this.connectCallback = null; // the message to call if err or if connect succ.
    this.reportErrorHandler = null; //report error to conn manager
    this.reportEndHandler = null; //report end to conn manager
    this.reportTimeoutHandler = null; // reports timeout to conn manager
    this.reportAYTHandler = null; // reports timeout to conn manager

    let _this = this;

    /**
     * telent connecting
     **/
    this.c.on('connect', function () {
      format.log(name, 'connecting...');
    });

    // will report conn timeout here
    /**
     * on connection error, eg. ETIMEOUT
     **/
    this.c.on('error', function (error) {
      //1. close connect 2. call callback  3.call onTelnetConnError to reconnect
      //format.error(name, error);
      _this.onerrorHandler(error);
      if (error === 'timeout') {
        if (_this.reportTimeoutHandler) {
          _this.reportTimeoutHandler(_this, 'timeout');
        }
      } else {
        if (_this.reportErrorHandler) {
          _this.reportErrorHandler(_this, error);
        }
      }
    });

    /**
     * in fact not occur, only if you set timeout by manaul, and it doesn't mean an error
     **/
    this.c.on('timeout', function () {
      format.log(name, 'timeout');
      if (_this.reportTimeoutHandler) {
        _this.reportTimeoutHandler(_this, 'timeout');
      }
    });

    /**
     * in fact not occur, only if you set timeout by manaul, and it doesn't mean an error
     **/
    this.c.on('AYT', function () {
      if (_this.reportAYTHandler) {
        _this.reportAYTHandler(_this, 'ayt');
      }
    });

    /**
     * on connection close.
     **/
    this.c.on('close', function (hadError) {
      format.log(name, 'close');
      _this.close();
    });

    /**
     * on connection end
     **/
    this. c.on('end', function (error: string|Error) {
      format.log(name, 'end');
      if (_this.reportEndHandler) {
        _this.reportEndHandler(_this, error);
      }
    });

    /**
     * on connection receive data.
     **/
    this.c.on('data', function (data) {
      if (!_this.connectState) {
        // the only place to mean connect succ.
        // 1. set states  2. call callback to notify succ.
        _this.connectState = true;
        _this.connecting = false;
        format.log(name, data);
        _this.svrReplyList.push(data);
        if (_this.connectCallback) {
          _this.connectCallback(null);
        }
        _this.connectCallback = noop;
      } else if (_this.svrReplyWatchers.length > 0) {
        // if have reader, give message to reader.

        // copy them, to void that
        // in the "watcher" new watcher will be added or clearWatcher will be called
        // so that "svrReplyWatchers" will be called again
        var svrReplyWatchersCopy = _this.svrReplyWatchers.splice(0);
        for (var i = 0, len = svrReplyWatchersCopy.length; i < len; i++) {
          var watcher = svrReplyWatchersCopy[i];
          watcher(null, [data]);
          _this.svrReplyWatchers.push(watcher);
        }
      } else {
        // no reader, so store the message.
        _this.svrReplyList.push(data);
      }
    });
  }

  cloneobj(obj: any) {
    return extend({}, obj);
  }

  /**
   * manually notify telnet to rise error to all reader,
   * that is because telnet can not sense the conn reset by themselves.
   **/
  clearWatcher(err: string | Error) {
    if (this.connectState) {
      format.log(
        this.name,
        'will rise error to ' + this.svrReplyWatchers.length + ' readers.'
      );
      if (this.svrReplyWatchers.length > 0) {
        // copy them, to void that
        // in the "watcher" new watcher will be added or clearWatcher will be called
        // so that "svrReplyWatchers" will be called again
        var svrReplyWatchersCopy = this.svrReplyWatchers.splice(0);
        for (var i = 0, len = svrReplyWatchersCopy.length; i < len; i++) {
          var watcher = svrReplyWatchersCopy[i];
          watcher(err);
        }
      }
    }
  }

  /**
   * set handler for end of connection
   **/
  setReportEndHandler(fnFromConnManage: Function) {
    this.reportEndHandler = fnFromConnManage;
  }

  /**
   * set error handle , report error to ConnManager.
   **/
  setReportErrorHandler(fnFromConnManage: Function) {
    this.reportErrorHandler = fnFromConnManage;
  }

  /**
   * set error handle , report error to ConnManager.
   **/
  setReportTimeoutHandler(fnFromConnManage: Function) {
    this.reportTimeoutHandler = fnFromConnManage;
  }

  /**
   * set error handle , report error to ConnManager.
   **/
  setReportAYTHandler(fnFromConnManage: Function) {
    this.reportAYTHandler = fnFromConnManage;
  }

  /**
   * onerrorHandler, called when error happen.
   **/
  onerrorHandler(error: string | Error) {
    //1. close connect 2. call callback  3.call onTelnetConnError to reconnect
    format.error(this.name, error);
    this.clearWatcher(error);
    this.close();
    if (this.connectCallback) {
      this.connectCallback(error);
    }
    this.connectCallback = noop;
  }

  /**
   * interface to read data.
   **/
  read(cb: (err: Error|null, arg2?: any[]) => void) {
    if (!this.connectState) {
      return cb(new Error('not connected to server'));
    }
    // already exist stored message.
    if (this.svrReplyList.length > 0) {
      cb(null, this.svrReplyList.splice(0));
    }
    // no existed message, so store it as a reader.
    this.svrReplyWatchers.push(cb);
  }

  /**
   * interface to write data.
   **/
  write(data: string | Uint8Array, cb: Function) {
    if (!this.connectState) {
      return cb(new Error('not connected to server'));
    }
    return this.c.write(data, cb);
  }

  /**
   * interface to connect to server.
   **/
  connect(newconfig: any, cb: Function) {
    if (this.connectState) {
      cb(new Error('alreay connected.'));
    } else if (this.connecting) {
      cb(new Error('alreay connecting.'));
    } else {
      this.connectCallback = cb;
      this.connecting = true;
      this.config = this.cloneobj(newconfig);
      this.c.connect(this.config);
    }
  }

  /**
   * interface to clear stored data.
   **/
  clear(): string[] {
    return this.svrReplyList.splice(0);
  }

  /**
   * close connection , infact just reset the state.
   **/
  close() {
    // no interface to close telnet, just reset the state.
    // is the only place to reset the connectState and connecting
    if (this.connectState || this.connecting) {
      this.connectState = false;
      this.connecting = false;
      this.c.destroy();
    }
  }

  /**
   * interface to get connection state.
   **/
   public getState() {
    return this.connectState;
  }

  /**
   * interface to get name.
   **/
   public getName() {
    return this.name;
  }

  /**
   * get config
   **/
  public getConfig() {
    return this.config;
  }
}

module.exports = TelnetClient;

import * as util from 'util';
import Utils from '../utils';
import ConnectionTarget from './connectionTarget';
import TelnetClient from './telnet/telnetcli';
import Telnet from './telnet/utilTelnet';

let AYT = '\xff\xf6';

export default class PyTelnet implements ConnectionTarget {
  public type: string = 'telnet';
  private stream: TelnetClient;
  public connected: boolean;
  private listening: boolean;
  private usernameSent: boolean;
  private passwordSent: boolean;
  private params: any;
  private address: any;
  private pingTimer: null;
  private receiveBuffer: string;
  private aytPending: boolean;
  private streamWrite: any;
  private onconnect?: Function;
  private onerror?: Function;
  private ontimeout?: Function;
  private onmessage: any;

  constructor(address: string, params: any) {
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

    this.streamWrite = util.promisify(stream.write).bind(stream);
  }

  public async sendPing(): Promise<any> {
    if (this.aytPending) {
      this.aytPending = false;
      throw new Error('Ping failed');
    }
    this.aytPending = true;
    await this.send(AYT);
    return true;
  }

  public async connect(
    onconnect: Function,
    onerror: Function,
    ontimeout: Function
  ): Promise<void> {
    this.onconnect = onconnect;
    this.onerror = onerror;
    this.ontimeout = ontimeout;
    this.usernameSent = false;
    this.passwordSent = false;
    let _this = this;
    this.params.host = this.address;

    this.stream.connect(this.params, function (err: string | Error) {
      if (typeof err === 'string') {
        onconnect(new Error(err));
      } else {
        onconnect(err);
      }
    });

    this.stream.setReportErrorHandler(function (telnet: Telnet, error: string) {
      if (onerror) {
        if (!error) {
          error = 'Connection lost';
        }
        onerror(new Error(error));
      }
    });

    let timeoutTriggered = false;
    this.stream.setReportTimeoutHandler(function (
      client: TelnetClient,
      error: string
    ) {
      if (ontimeout) {
        if (!timeoutTriggered) {
          timeoutTriggered = true;
          ontimeout(error);
        }
      }
    });

    // eslint-disable-next-line no-unused-vars
    this.stream.setReportAYTHandler(function (
      client: TelnetClient,
      type: string
    ) {
      _this.aytPending = false;
    });
  }

  public async disconnect(cb?: Function): Promise<void> {
    this.stream.close();
    // give the connection time to close.
    // there is no proper callback for this in the telnet lib.

    await Utils.sleep(200);
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (cb) {
      cb();
    }
  }

  public registerListener(cb: Function): void {
    this.onmessage = cb;

    this.stream.read(function (err: Error | null, recv?: any[]) {
      if (recv) {
        let data = recv.join('');
        let raw = Buffer.from(recv);
        cb(data, raw);
      }
    });
  }

  public async send(msg: string): Promise<void> {
    let data = Buffer.from(msg, 'binary');
    await this.sendRaw(data);
  }

  private async sendRaw(data: Buffer): Promise<void> {
    await this.streamWrite(data);
  }

  public async sendCmd(cmd: string, drain?: boolean): Promise<void> {
    let mssg = '\x1b\x1b' + cmd;
    let data = Buffer.from(mssg, 'binary');
    await this.sendRaw(data);
  }

  public async flush(): Promise<any> {}
}

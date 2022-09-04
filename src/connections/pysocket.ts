import * as util from 'util';
import { Socket } from 'net';
import ConnectionTarget from './connectionTarget';

export default class PySocket implements ConnectionTarget {
  public type: string = 'socket';
  private stream: Socket | null;
  public connected: boolean;
  private params: any;
  private address: string;
  private receiveBuffer: string;
  private onErrorCalled: boolean;
  private usernameSent?: boolean;
  private passwordSent?: boolean;
  private onmessage: any;
  private onconnect?: Function;
  private onerror?: Function;
  private ontimeout?: Function;
  private streamDestroy: (arg1?: Error | undefined) => Promise<unknown>;
  private streamWrite: (arg1: string | Uint8Array) => Promise<void>;

  constructor(address: string, params: any) {
    let stream = new Socket();
    this.stream = stream;

    this.stream.setTimeout(params.timeout);
    this.connected = false;
    this.params = params;
    this.address = address;
    this.receiveBuffer = '';
    this.onErrorCalled = false;

    this.streamDestroy = util.promisify(stream.destroy).bind(stream);
    this.streamWrite = util.promisify(stream.write).bind(stream);
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
    this.stream?.connect(this.params.port, this.address);
    this.stream?.on('connect', function () {
      onconnect();
    });
    this.stream?.on('timeout', function () {
      ontimeout();
    });
    this.stream?.on('error', function (error) {
      if (!_this.onErrorCalled) {
        _this.onErrorCalled = true;
        onerror(error);
      }
    });
    this.stream?.on('close', function (hadError) {
      if (hadError && !_this.onErrorCalled) {
        _this.onErrorCalled = true;
        onerror();
      }
    });
    this.stream?.on('end', function () {
      if (!_this.onErrorCalled) {
        _this.onErrorCalled = true;
      }
    });
  }

  public async disconnect(): Promise<void> {
    await this.streamDestroy();
    this.stream = null;
  }

  public registerListener(cb: Function): void {
    this.onmessage = cb;
    this.stream?.on('data', function (data) {
      let raw = Buffer.from(data);
      cb(data, raw);
    });
  }

  public async send(msg: string, drain?: boolean): Promise<void> {
    msg = msg.replace('\x1b', '\x1b\x1b');
    let data = Buffer.from(msg, 'binary');

    if (this.stream) {
      await this.streamWrite(data);
    } else {
      throw new Error('Not connected');
    }
  }

  public async sendPing(): Promise<true> {
    return true;
  }

  public async flush(): Promise<any> {}
}

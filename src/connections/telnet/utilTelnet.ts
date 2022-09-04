import { Socket } from 'net';
import { EventEmitter } from 'events';

export type TelnetConnectOptions = {
  host?: string;
  port?: number;
  log?: boolean;
  timeout?: number;
  username?: string;
  password?: string;
  enpassword?: string;
  sock?: Socket;
};

export default class Telnet extends EventEmitter {
  operation: string[];
  option: string[];
  private host: any;
  private port: any;
  private log: any;
  private timeout: any;
  private username: any;
  private password: any;
  private enpassword: any;
  private en: boolean = false;
  private authenticated: boolean = false;
  private sock: Socket | null = null;

  constructor() {
    super();

    this.operation = [];
    this.operation[255] = 'IAC';
    this.operation[254] = 'DONT';
    this.operation[253] = 'DO';
    this.operation[252] = 'WONT';
    this.operation[251] = 'WILL';
    this.operation[250] = 'SB';
    this.operation[249] = 'GA';
    this.operation[248] = 'EL';
    this.operation[247] = 'EC';
    this.operation[246] = 'AYT';
    this.operation[245] = 'AO';
    this.operation[244] = 'IP';
    this.operation[243] = 'BRK';
    this.operation[242] = 'DM';
    this.operation[241] = 'NOP';
    this.operation[240] = 'SE';
    this.option = [];
    this.option[0] = 'transmitBinary';
    this.option[1] = 'echo';
    this.option[2] = 'reconnection';
    this.option[3] = 'suppressGoAhead';
    this.option[4] = 'approxMessageSizeNegotiation';
    this.option[5] = 'status';
    this.option[6] = 'timingMark';
    this.option[7] = 'remoteControlledTransandEcho';
    this.option[8] = 'outputLineWidth';
    this.option[9] = 'outputPageSize';
    this.option[10] = 'outputCarriageReturnDisposition';
    this.option[23] = 'sendLocation';
    this.option[24] = 'terminalType';
    this.option[31] = 'windowSize';
    this.option[32] = 'terminalSpeed';
    this.option[33] = 'remoteFlowControl';
    this.option[34] = 'linemode';
    this.option[35] = 'displayLocation';
    this.option[36] = 'environmentVariables';
    this.option[39] = 'environmentOption';
  }

  public connect(opts: TelnetConnectOptions) {
    this.host = opts.host || 'localhost';
    this.port = opts.port || 23;

    this.log = opts.log || false;
    this.timeout = opts.timeout || 20000;

    this.username = opts.username;
    this.password = opts.password;
    this.enpassword = opts.enpassword;

    this.en = false;
    this.authenticated = false;

    this.sock = opts.sock ? opts.sock : new Socket();
    var _self = this;
    this.sock.connect(this.port, this.host);
    this.sock.setTimeout(this.timeout);

    this.sock.on('connect', function () {
      _self.emit('connect');
    });
    this.sock.on('data', function (data: any) {
      _self.processBuffer(data);
    });
    this.sock.on('timeout', function () {
      _self.emit('timeout');
    });
    this.sock.on('error', function (err: string | Error) {
      _self.emit('error', err);
    });
    this.sock.on('end', function () {
      _self.emit('end');
    });
    this.sock.on('close', function (hadError: boolean) {
      _self.emit('close', hadError);
    });
  }

  processBuffer(buffer: Buffer) {
    var _self = this;
    var result: { cmd: any; data: any } = { cmd: [], data: [] };
    var negotiation = { iac: false, operation: '', option: '' };
    var keyfound = false;
    for (var i = 0; i < buffer.length; i++) {
      if (this.operation[buffer[i]] === 'IAC') {
        negotiation.iac = true;
        i++;
        negotiation.operation = this.operation[buffer[i]];
        i++;
        if (negotiation.operation === 'SB') {
          while (this.operation[buffer[i]] !== 'IAC') {
            negotiation.option += this.option[buffer[i]] + ' ';
            i++;
          }
          negotiation.option +=
            this.operation[buffer[i]] + '.' + this.operation[buffer[i + 1]];
          i++;
        } else {
          negotiation.option = this.option[buffer[i]];
        }
        result.cmd.push(negotiation);
        negotiation = { iac: false, operation: '', option: '' };
      } else {
        result.data.push(buffer[i]);
      }
    }
    result.data = Buffer.from(result.data);

    Object.keys(result.cmd).forEach(function (key) {
      var reqCMD =
        'IAC.' + result.cmd[key].operation + '.' + result.cmd[key].option;
      var resCMD = 'IAC.WONT.';
      switch (result.cmd[key].operation) {
        case 'DO':
          switch (result.cmd[key].option) {
            case 'terminalType':
              resCMD = 'IAC.WILL.' + result.cmd[key].option;
              resCMD += '.IAC.WILL.windowSize';
              break;
            case 'windowSize':
              resCMD =
                'IAC.SB.windowSize.transmitBinary.200.transmitBinary.64.IAC.SE';
              break;
            default:
              resCMD += result.cmd[key].option;
              break;
          }
          break;
        case 'AYT':
          resCMD = '';
          _self.emit('AYT');
          break;
        case 'WILL':
          switch (result.cmd[key].option) {
            case 'suppressGoAhead':
              resCMD = 'IAC.DO.' + result.cmd[key].option;
              break;
            default:
              resCMD = 'IAC.DO.' + result.cmd[key].option;
              break;
          }
          break;
        case 'SB':
          switch (result.cmd[key].option) {
            case 'terminalType echo IAC.SE':
              resCMD = 'IAC.SB.terminalType.transmitBinary.ANSI.IAC.SE';
              break;
            default:
              break;
          }
          break;
        case 'DONT':
          switch (result.cmd[key].option) {
            default:
              resCMD += result.cmd[key].option;
              break;
          }
          break;
        case 'WONT':
          switch (result.cmd[key].option) {
            default:
              resCMD = 'IAC.DONT.' + result.cmd[key].option;
              break;
          }
        default:
          break;
      }
      if (_self.log) {
        console.log('rx:', reqCMD);
        console.log('tx:', resCMD);
      }

      _self.write(_self.cmdtoBuffer(resCMD));
    });

    if (result.data.length > 0) {
      _self.emit('data', result.data);
    }
  }

  public write(data: string | Uint8Array, cb?: Function) {
    this.sock?.write(data);
    if (cb) {
      cb();
    }
  }

  public cmdtoBuffer(cmd: string): Buffer {
    var _self = this;
    var CMD: string[] = cmd.split('.');
    var buffer: number[] = [];

    Object.keys(CMD).forEach(function (value: string, idx: number) {
      if (_self.operation.indexOf(CMD[idx]) !== -1) {
        buffer.push(_self.operation.indexOf(CMD[idx]));
      } else if (_self.option.indexOf(CMD[idx]) !== -1) {
        buffer.push(_self.option.indexOf(CMD[idx]));
      } else if (parseInt(CMD[idx]) >= 0) {
        buffer.push(parseInt(CMD[idx]));
      } else {
        for (var i = 0; i < CMD[idx].length; i++) {
          buffer.push(CMD[idx].charCodeAt(i));
        }
      }
    });
    return Buffer.from(buffer);
  }

  public destroy(err?: Error | undefined) {
    this.sock?.destroy(err);
    this.sock = null;
  }
}

import * as util from 'util';
import Logger from '../logger';
import { promises as fs, constants as fsConstants } from 'fs';
import { SerialPort } from 'serialport';
import SettingsWrapper, { SettingsKey } from '../settingsWrapper';
import ConnectionTarget from './connectionTarget';

export default class PySerial implements ConnectionTarget {
  public type: string = 'serial';
  public connected: boolean;
  private params: any;
  private address: string;
  private aytPending: boolean;
  private logger: Logger;
  private stream?: SerialPort<any>;
  private streamOpen: (
    openCallback?: ((err: Error | null) => void) | undefined
  ) => Promise<void>;
  private streamSet: any;
  private streamWrite: (data: any) => Promise<unknown>;
  private streamDrain: Function;
  private streamClose: Function;
  private streamFlush: Function;
  private manufacturers: string | boolean | string[] | undefined;
  private dtrSupported: boolean;
  private onmessage?: Function;

  constructor(address: string, params: any, settings: SettingsWrapper) {
    this.params = params;
    this.address = address;
    this.aytPending = false;
    this.logger = new Logger('PySerial');
    this.connected = false;

    let _this = this;

    let stream = new SerialPort(
      {
        path: address,
        baudRate: 115200,
        autoOpen: false,
      },
      function (err: any) {
        _this.logger.warning('Failed to connect to SerialPort');
        _this.logger.warning(err);
      }
    );

    this.stream = stream;

    this.streamOpen = util.promisify(stream.open).bind(stream);
    this.streamSet = util.promisify(stream.set).bind(stream);
    this.streamWrite = util.promisify(stream.write).bind(stream);
    this.streamDrain = util.promisify(stream.drain).bind(stream);
    this.streamClose = util.promisify(stream.close).bind(stream);
    this.streamFlush = util.promisify(stream.flush).bind(stream);

    this.manufacturers = settings.get(
      SettingsKey.autoconnectComportManufacturers
    );
    this.dtrSupported = ['darwin'].indexOf(process.platform) > -1;
  }

  public async connect(
    onconnect: Function,
    onerror: Function,
    ontimeout: Function
  ): Promise<void> {
    let _this = this;
    let isErrorThrown = false;

    let timeout = setTimeout(async function () {
      if (!isErrorThrown) {
        isErrorThrown = true;
        ontimeout(new Error('Timeout while connecting'));
        await _this.disconnect();
      }
    }, _this.params.timeout);

    console.log('Trying to open stream');

    // open errors will be emitted as an error event
    this.stream?.on('error', function (err: any) {
      if (!isErrorThrown) {
        isErrorThrown = true;
        onerror(new Error(err));
      }
    });

    await this.streamOpen();
    /**callback causes infinity loop if no error occurs
     * (err: Error | null) => {
      // avoid crashing without an error information form com port for example
      if (err) {
        if (!isErrorThrown) {
          isErrorThrown = true;
          onerror(err);
        }
      }
    }
     */
    await this.sendPing();

    // Got this far, so clear the timeout
    clearTimeout(timeout);

    await this.send('\r\n');
    onconnect();
  }

  public async disconnect(): Promise<void> {
    if (this.stream?.isOpen) {
      await this.streamClose();
    }
  }

  public registerListener(cb: Function): void {
    let _this = this;
    this.onmessage = cb;
    this.stream?.on('data', function (data: any) {
      let dataStr: string = data.toString();
      data = Buffer.from(data);
      _this.onmessage!(dataStr, data);
    });
  }

  public async send(mssg: string, drain: boolean = true): Promise<void> {
    let data = Buffer.from(mssg, 'binary');

    await this.streamWrite(data);

    if (drain) {
      await this.streamDrain();
    }
  }

  public static async isSerialPort(name: string): Promise<boolean> {
    if (
      name &&
      (name.substring(0, 3) === 'COM' ||
        name.indexOf('tty') > -1 ||
        name.indexOf('/dev') > -1)
    ) {
      return true;
    } else {
      try {
        await fs.access(name, fsConstants.F_OK);
        return true;
      } catch (err) {
        return false;
      }
    }
  }

  public static async listTargetBoards(settings: SettingsWrapper) {
    // returns { names: [], manus: [] }
    let names = [];
    let manus = [];

    await settings.refresh();

    let manufacturers = settings.get(
      SettingsKey.autoconnectComportManufacturers
    ) as string[];
    let listResult = await PySerial.listBoards(settings);

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
      manus: manus,
    };
  }

  public static async listBoards(
    settings: SettingsWrapper
  ): Promise<{ names: string[]; manus: string[] }> {
    // returns { names: [], manus: [] }
    let targetManufacturers = settings.get(
      SettingsKey.autoconnectComportManufacturers
    ) as string[];
    let ports = await SerialPort.list();

    let portnames: string[] = [];
    let otherPortnames: string[] = [];
    let manufacturers: string[] = [];
    let otherManufacturers: string[] = [];

    // eslint-disable-next-line no-unused-vars
    ports.forEach((port, index, array) => {
      let name = port.path;

      if (!!name) {
        if (name.indexOf('Bluetooth') === -1) {
          // use vendorId if manufacturer string is null
          let manu = port.manufacturer
            ? port.manufacturer
            : port.vendorId
            ? port.vendorId
            : 'Unknown manufacturer';
          let targetIndex = targetManufacturers.indexOf(manu);

          if (targetIndex > -1) {
            let j;
            for (j = 0; j < manufacturers.length; j++) {
              if (targetIndex < targetManufacturers.indexOf(manufacturers[j])) {
                break;
              }
            }

            portnames.splice(j, 0, name);
            manufacturers.splice(j, 0, manu);
          } else {
            otherPortnames.push(name);
            otherManufacturers.push(manu);
          }
        }
      }
    });

    return {
      names: portnames.concat(otherPortnames),
      manus: manufacturers.concat(otherManufacturers),
    };
  }

  public async sendPing(): Promise<void> {
    if (process.platform === 'win32') {
      // avoid MCU waiting in bootloader on hardware restart by setting both dtr and rts high
      await this.streamSet({
        rts: true,
      });
    }

    if (this.dtrSupported) {
      let err = await this.streamSet({
        dtr: true,
      });
      if (err) {
        throw err;
      }
    }
  }

  public async flush(): Promise<any> {
    return await this.streamFlush();
  }
}

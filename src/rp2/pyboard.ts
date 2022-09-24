import * as _ from 'lodash';
import Config, { Constants } from '../config';
import ConnectionTarget from '../connections/connectionTarget';
import PySerial from '../connections/pyserial';
import PySocket from '../connections/pysocket';
import PyTelnet from '../connections/pytelnet';
import Logger from '../logger';
import SettingsWrapper, { SettingsKey } from '../settingsWrapper';
import Authorize from './authorize';

const CTRL_A = '\x01'; // raw repl
const CTRL_B = '\x02'; // exit raw repl
const CTRL_C = '\x03'; // ctrl-c
const CTRL_D = '\x04'; // reset (ctrl-d)
const CTRL_E = '\x05'; // paste mode (ctrl-e)
const CTRL_F = '\x06'; // safe boot (ctrl-f)
const CTRLS = [CTRL_A, CTRL_B, CTRL_C, CTRL_D, CTRL_E, CTRL_F];

const replEntryWaitfor = 'raw REPL; CTRL-B to exit\r\n>';

// statuses
const DISCONNECTED = 0;
const CONNECTED = 1;
const FRIENDLY_REPL = 2;
const RAW_REPL = 3;
const PASTE_MODE = 4;

export default class Pyboard {
  public connected: boolean;
  public connecting: boolean;
  private rawResponseStarted: boolean;
  private commandResponseBuffer: string;
  private waitingFor: any;
  private waitingForTimer?: NodeJS.Timeout;
  private promise: {
    resolve: (msg: string) => void;
    reject: (err: string | Error, arg2?: string) => void;
  } | null;
  private waitingForTimeout: number = 8000;
  public status: number;
  private pingTimer: NodeJS.Timer | null;
  private pingCount: number;
  public isSerial: boolean;
  public type?: string;
  private settings: SettingsWrapper;
  private timeout: number;
  private authorize: Authorize;
  private logger: Logger;
  private config: Constants;
  public address: string | null;
  public params:
    | {
        port: number;
        username: string;
        password: string;
        enpassword: string;
        timeout: number;
        ctrlCOnConnect: string | boolean | string[] | undefined;
      }
    | undefined;
  public connection?: ConnectionTarget;
  private statusListenerCB: any;
  private onerror?: (err: Error) => Promise<void>;
  private waitForBlock: any;
  private onconnect?: (
    err: string | null,
    addr?: string | null
  ) => Promise<void>;
  private ontimeout?: (mssg: Error, raw?: any) => void;
  private onmessage?: (message: string) => Promise<void>;

  constructor(settings: SettingsWrapper) {
    this.connected = false;
    this.connecting = false;
    this.rawResponseStarted = false;
    this.commandResponseBuffer = '';
    this.waitingFor = null;
    this.promise = null;
    this.status = DISCONNECTED;
    this.pingTimer = null;
    this.pingCount = 0;
    this.isSerial = false;
    this.settings = settings;
    this.timeout = settings.timeout;
    this.authorize = new Authorize(this);
    this.logger = new Logger('Pyboard');
    this.config = Config.constants();
    this.address = null;
  }

  public async refreshConfig() {
    this.params = {
      port: 23,
      username: this.settings.username,
      password: this.settings.password,
      enpassword: '',
      timeout: this.settings.timeout,
      ctrlCOnConnect: this.settings.get(SettingsKey.ctrlCOnConnect),
    };
  }

  public setAddress(address: string) {
    this.address = address;
  }

  private startPings(interval: number) {
    this.pingTimer = setInterval(async () => {
      try {
        await this.connection?.sendPing();
        this.pingCount = 0;
      } catch (err) {
        this.pingCount += 1;
      }

      if (this.pingCount > 1) {
        // timeout after 2 pings
        this.pingCount = 0;
        clearInterval(this.pingTimer!);
        if (this.ontimeout) {
          this.ontimeout(new Error('Connection lost'));
        }
        await this.disconnect();
      }
    }, interval * 1000);
  }

  private stopPings(): void {
    clearInterval(this.pingTimer!);
  }

  public setStatus(status: number): void {
    if (status !== this.status) {
      this.status = status;
      if (this.statusListenerCB) {
        this.statusListenerCB(status);
      }
    }
  }

  public registerStatusListener(cb: (arg: number) => void): void {
    this.statusListenerCB = cb;
  }

  public async enterFriendlyRepl(): Promise<void> {
    await this.sendWait(CTRL_B, '\r\n>>>', null);
  }

  private async enterFriendlyReplWait(): Promise<void> {
    await this.sendWait(
      CTRL_B,
      'Type "help()" for more information.\r\n>>>',
      null
    );
    if (this.onmessage) {
      this.onmessage('\r\n>>> ');
    }
  }

  public async enterFriendlyReplNonBlocking(): Promise<void> {
    await this.send(CTRL_B);
  }

  private async softReset(timeout: number): Promise<unknown> {
    if (!timeout) {
      timeout = 5000;
    }
    this.logger.info('Soft reset');
    let waitFor = this.status === RAW_REPL ? '>' : 'OK';
    return await this.sendWait(CTRL_D, waitFor, timeout);
  }

  public async softResetNoFollow(): Promise<void> {
    this.logger.info('Soft reset no follow');
    this.send(CTRL_D);
  }

  public async safeboot(timeout?: number): Promise<void> {
    this.logger.info('Safe boot');
    await this.sendWait(
      CTRL_F,
      'Type "help()" for more information.\r\n>>>',
      timeout
    );
  }

  private async stopRunningPrograms(): Promise<void> {
    await this.sendWait(CTRL_C, '>>>', 5000);
  }

  public async stopRunningProgramsDouble(timeout: number): Promise<void> {
    await this.sendWait(CTRL_C + CTRL_C, '>>>', timeout);
  }

  public async stopRunningProgramsNoFollow(): Promise<void> {
    this.logger.info('CTRL-C (nofollow)');
    await this.send(`${CTRL_C}\r\n`);
  }

  public async enterRawReplNoReset(): Promise<void> {
    try {
      await this.flush();

      this.logger.info('Entering raw repl');

      await this.sendWait(CTRL_A, replEntryWaitfor, 5000);
    } catch (err: any) {
      if (this.promise) {
        (
          this.promise as {
            resolve: (msg: string) => void;
            reject: (err: string | Error, arg2?: string) => void;
          }
        ).reject(err);
      }
    }
  }

  public isConnecting(): boolean {
    return this.connecting && !this.connected;
  }

  public async connect(
    address: string,
    callback: (err: string | null, addr?: string | null) => Promise<void>,
    onerror: (err: Error) => Promise<void>,
    ontimeout: (err: Error, raw?: any) => void,
    onmessage: any,
    raw?: boolean
  ): Promise<void> {
    this.connecting = true;
    this.onconnect = callback;
    this.onmessage = onmessage;
    this.ontimeout = ontimeout;
    this.onerror = onerror;
    this.address = address;
    this.stopWaitingForSilent();
    await this.refreshConfig();
    this.isSerial = await PySerial.isSerialPort(this.address);

    if (this.isSerial) {
      this.connection = new PySerial(this.address, this.params, this.settings);
    } else if (raw) {
      this.connection = new PySocket(this.address, this.params);
    } else {
      this.connection = new PyTelnet(this.address, this.params);
    }

    this.type = this.connection?.type;

    if (this.connection.type === 'telnet') {
      try {
        await this.authorize.run();
        await this.onConnnect(callback);
      } catch (error: any) {
        await this.disconnected();
        callback(error, this.address);
      }
    }

    // deprecated via arrow function replace for "function () {}"
    // local memory this reference
    //let _this = this;

    // start connection via one of the ConnectionTarget defined interfaces
    await this.connection.connect(
      // onconnect
      async () => {
        this.connection?.registerListener(
          async (
            msg: string,
            // eslint-disable-next-line no-unused-vars
            raw?: any
          ) => {
            await this.receive(msg);
          }
        );

        if (this.connection?.type !== 'telnet') {
          await this.onConnnect(callback);
        }
      },

      // onerror
      async (err: Error) => {
        await this.disconnected();
        if (this.onerror) {
          this.onerror(err);
        }
      },

      // ontimeout
      async (msg: Error) => {
        // Timeout callback only works properly during connect
        // after that it might trigger unneccesarily
        if (this.isConnecting()) {
          await this.disconnected();
          ontimeout(msg, raw);
        }
      }
    );
  }

  private async onConnnect(
    cb: (err: string | null, address?: string | null) => Promise<void>
  ) {
    this.setStatus(CONNECTED);
    this.connected = true;
    this.connection!.connected = true;

    this.connecting = false;

    if (this.params?.ctrlCOnConnect && this.type !== 'socket') {
      await this.stopRunningPrograms();
    } else {
      await cb(null, this.address);
    }

    this.startPings(5);
  }

  private async disconnected() {
    await this.connection?.disconnect();
    this.connecting = false;
    this.connected = false;
    this.stopPings();
  }

  public async reconnect() {
    let address = this.address;
    let callback = this.onconnect;
    let onerror = this.onerror;
    let ontimeout = this.ontimeout;
    let onmessage = this.onmessage;
    let raw = this.type === 'socket';

    await this.disconnect();
    if (address && callback && ontimeout && onerror) {
      await this.connect(address, callback, onerror, ontimeout, onmessage, raw);
    }
  }

  private getWaitType(): string {
    let type = Object.prototype.toString.call(this.waitingFor);

    switch (type) {
      case '[object RegExp]':
        return 'regex';
      case '[object String]':
        return 'literal';
      case '[object Number]':
        return 'length';
      default:
        throw new Error('Unknown wait type');
    }
  }

  private isFriendlyLiteralWaitMatch(buffer: string) {
    if (
      this.getWaitType() === 'literal' &&
      this.status !== RAW_REPL &&
      this.waitFor !== null &&
      buffer.indexOf(this.waitingFor!.toString()) > -1 &&
      buffer.indexOf('>>> ') > -1
    ) {
      return true;
    }

    return false;
  }

  private isRawLiteralWaitMatch(buffer: string) {
    if (
      this.getWaitType() === 'literal' &&
      (this.status === RAW_REPL || buffer.indexOf(replEntryWaitfor) > -1) &&
      this.waitingFor !== null &&
      buffer.indexOf(this.waitingFor!.toString()) > -1
    ) {
      return true;
    }

    return false;
  }

  private isFriendlyRegexWaitMatch(buffer: string) {
    if (
      this.status === FRIENDLY_REPL &&
      this.getWaitType() === 'regex' &&
      this.waitingFor?.test(buffer)
    ) {
      return true;
    }

    return false;
  }

  private isRawRegexWaitMatch(buffer: string): boolean {
    if (
      this.status === RAW_REPL &&
      this.getWaitType() === 'regex' &&
      this.waitingFor?.test(buffer)
    ) {
      return true;
    }

    return false;
  }

  public async receive(msg: string): Promise<void> {
    this.logger.silly('Received message: ' + msg);
    if (
      !this.waitForBlock &&
      typeof msg !== 'object' &&
      this.onmessage !== undefined
    ) {
      this.onmessage(msg);
    }
    let errInOutput = this.getErrorMessage(msg);

    this.commandResponseBuffer += msg;

    if (this.commandResponseBuffer.length > 80000) {
      this.commandResponseBuffer = this.commandResponseBuffer.substring(40000);
    }

    this.logger.silly('Buffer length now ' + this.commandResponseBuffer.length);

    if (errInOutput !== '') {
      this.logger.silly('Error in output: ' + errInOutput);
      let err = new Error(errInOutput);
      if (this.waitingFor !== null) {
        this.stopWaitingFor(this.commandResponseBuffer, err);
      } else {
        if (this.onerror) {
          this.onerror(err);
        }
      }
    } else if (this.waitingFor !== null && msg) {
      this.logger.silly('Waiting for ' + this.waitingFor);

      if (this.commandResponseBuffer === undefined) {
        this.commandResponseBuffer = '';
      }

      if (
        this.commandResponseBuffer.indexOf('Invalid credentials, try again.') >
        -1
      ) {
        await this.disconnected();
        if (this.onconnect) {
          this.onconnect('Invalid credentials');
        }
        this.stopWaitingForSilent();
        this.waitForBlocking('Login as:', {
          // eslint-disable-next-line no-unused-vars
          resolve: function (msg: string) {
            // do nothing
          },
          // eslint-disable-next-line no-unused-vars
          reject: function (err: string | Error, arg2?: string) {
            // do nothing
          },
        });
      }

      if (this.getWaitType() === 'length') {
        this.logger.silly(
          'Waiting for ' +
            this.waitingFor +
            ', got ' +
            this.commandResponseBuffer.length +
            ' so far'
        );
        if (this.commandResponseBuffer.length >= this.waitingFor.length) {
          this.stopWaitingFor(this.commandResponseBuffer);
        }
      } else if (
        this.isFriendlyLiteralWaitMatch(this.commandResponseBuffer) ||
        this.isFriendlyRegexWaitMatch(this.commandResponseBuffer)
      ) {
        // this was pop(-1)
        let trail = this.commandResponseBuffer.split(this.waitingFor).pop();
        if (trail && trail.length > 0 && this.waitForBlock && this.onmessage) {
          this.onmessage(trail);
        }
        this.stopWaitingFor(this.commandResponseBuffer);
      } else if (msg.indexOf(replEntryWaitfor) > -1) {
        this.stopWaitingFor(this.commandResponseBuffer);
      } else if (this.status === RAW_REPL) {
        if (msg.indexOf(replEntryWaitfor) > -1) {
          msg = '';
        }

        if (!this.rawResponseStarted && msg.startsWith('OK')) {
          msg = msg.substring(2);
          this.rawResponseStarted = true;
        }

        // this.logger.warning(`rawResponseStarted: ${this.rawResponseStarted}`);
        // this.logger.warning(`msg: ${msg}`);
        // this.logger.warning(`Waiting for: ${this.waitingFor}`);
        // this.logger.warning('');

        if (this.rawResponseStarted) {
          // \u0004 is EOT - End of Transmission ASCII character.
          if (/(\r\n)?\u0004\>/m.test(msg)) {
            msg = msg.substring(0, msg.indexOf('\u0004>'));
          }

          // this.logger.warning(`Modified mssg: ${mssg}`);

          if (msg.length > 0 && this.onmessage) {
            this.onmessage(msg);
          }
        }

        if (this.isRawRegexWaitMatch(this.commandResponseBuffer)) {
          // this.logger.warning('Stopping!');
          this.stopWaitingFor(this.commandResponseBuffer);
        }
      }
    }
  }

  public stopWaitingForSilent() {
    let promise = this.promise;

    clearTimeout(this.waitingForTimer);
    this.waitingFor = null;
    this.waitForBlock = false;
    this.promise = null;

    return promise;
  }

  private stopWaitingFor(msg: string, err?: Error) {
    this.logger.silly(
      'Stopping waiting for, got message of ' + msg.length + ' chars'
    );

    let promise = this.stopWaitingForSilent();

    if (promise) {
      // This is a promise-based command.
      if (err) {
        (
          promise as {
            resolve: (msg: string) => void;
            reject: (err: Error) => void;
          }
        ).reject(err);
      } else {
        (
          promise as {
            resolve: (msg: string) => void;
            reject: (err: Error) => void;
          }
        ).resolve(msg);
      }
    } else {
      this.logger.silly('No callback after waiting');
    }
  }

  public async disconnect() {
    await this.disconnectSilent();
    this.setStatus(DISCONNECTED);
  }

  public async disconnectSilent() {
    await this.disconnected();
  }

  /**
   * Run code on Pico (W) repl
   *
   * @param code Code to run
   * @returns Promise that resolves with the output of the code
   */
  public async run(code: string): Promise<string | undefined> {
    try {
      let alreadyRaw = this.status === RAW_REPL;

      await this.stopRunningPrograms();

      if (!alreadyRaw) {
        await this.enterRawReplNoReset();
      }

      // executing code delayed (20ms) to make sure _this.wait_for(">") is executed before execution is complete
      code += '\r\nimport time';
      code += '\r\ntime.sleep(0.1)';

      let response = await this.sendWait(code, null, 0);

      if (!alreadyRaw) {
        await this.enterFriendlyReplWait();
      }

      return response;
    } catch (err: any) {
      this.logger.error(err.message.toString());
      await this.softResetNoFollow();
    }
  }

  public async sendUserInput(msg: string) {
    await this.send(msg);
  }

  public waitForBlocking(
    waitFor: any,
    promise: {
      resolve: (msg: string) => void;
      reject: (err: string | Error, arg2?: string) => void;
    },
    timeout?: number | null
  ): void {
    this.waitFor(waitFor, promise, timeout);
    this.waitForBlock = true;
  }

  public waitFor(
    waitFor: any,
    promise: {
      resolve: (msg: string) => void;
      reject: (err: string | Error, arg2?: string) => void;
    },
    timeout?: number | null,
    clear = true
  ): void {
    this.waitForBlock = false;
    this.waitingFor = waitFor;
    this.promise = promise;
    if (timeout) {
      this.waitingForTimeout = timeout;
    }

    if (clear) {
      this.commandResponseBuffer = '';
      this.rawResponseStarted = this.status !== RAW_REPL;
    }

    clearTimeout(this.waitingForTimer);

    if (timeout && timeout > 0) {
      this.waitingForTimer = setTimeout(() => {
        if (this.promise) {
          let temp: {
            resolve: (msg: string) => void;
            reject: (err: string | Error, arg2?: string) => void;
          } = this.promise;
          this.promise = null;
          this.waitForBlock = false;
          this.waitingFor = null;
          this.commandResponseBuffer = '';
          this.rawResponseStarted = true;

          if (temp) {
            temp.reject(new Error('timeout'), this.commandResponseBuffer);
          }
        }
      }, timeout);
    }
  }

  public async send(command: string, drain: boolean = true): Promise<void> {
    if (this.connection) {
      await this.connection.send(command, drain);

      if (command === CTRL_A) {
        this.setStatus(RAW_REPL);
      } else if (command === CTRL_B) {
        this.setStatus(FRIENDLY_REPL);
      } else if (command === CTRL_E) {
        this.setStatus(PASTE_MODE);
      }
    }
  }

  public async sendWait(
    command: string,
    waitFor: string | RegExp | null = null,
    timeout: number | null = 5000
  ): Promise<string> {
    let result: string | null = null;

    if (!waitFor) {
      waitFor = this.status === RAW_REPL ? /(\r\n)?\u0004\>/ : command;
    }

    if (!_.includes(CTRLS, command) && !command.endsWith('\r\n')) {
      command += '\r\n';
    }

    // If we're waiting for a response, we need to
    // run the commands we've sent if we're in
    // raw REPL. Only do this if we're not exiting raw
    // REPL, though.
    if (
      this.status === RAW_REPL &&
      !command.endsWith(CTRL_D) &&
      command !== CTRL_B
    ) {
      command += CTRL_D;
    }

    // If we're changing mode, we'll be sending in one mode (already catered for
    // above), but will looking for completion in another. Since we've now configured
    // the data for sending, we're safe to change mode.
    if (command === CTRL_A) {
      this.setStatus(RAW_REPL);
    } else if (command === CTRL_B) {
      this.setStatus(FRIENDLY_REPL);
    }

    let promise = new Promise((resolve, reject) => {
      this.waitForBlocking(
        waitFor,
        {
          resolve: resolve,
          reject: reject,
        },
        timeout
      );

      this.send(command);
    });

    result = await (promise as Promise<string>);
    let received: string = result;

    if (this.status === RAW_REPL) {
      if (received.startsWith('OK')) {
        received = received.substring(2);
      }

      if (received.startsWith('>OK')) {
        received = received.substring(3);
      }

      // EOT - End of Transmission ASCII character.
      if (received.indexOf('\u0004') >= 0) {
        received = received.substring(0, received.indexOf('\u0004'));
      }
    } else {
      if (received.startsWith(command)) {
        received = received.substring(command.length);
      }

      if (received.endsWith('>>> ')) {
        received = received.substring(0, received.length - 4);
      }
    }

    return received;
  }

  private async execRawNoReset(code: string) {
    this.logger.verbose('Executing code:' + code);
    return await this.sendWait(code);
  }

  public async flush(): Promise<void> {
    if (this.connection) {
      await this.connection.flush();
    }
  }

  public getErrorMessage(text: string): string {
    let messages = this.config.errorMessages;
    for (let key in messages) {
      if (text.indexOf(key) > -1) {
        return messages[key];
      }
    }
    return '';
  }
}

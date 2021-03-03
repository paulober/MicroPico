'use babel';

import utils from '../helpers/utils.js';

export default class Authorize {

  constructor(board) {
    this.board = board;
    this.running = false;
    this.receivedLoginAs = false;
  }

  async run() {
    let pyboard = this.board;
    this.running = true;

    try {
      if (pyboard.connection.type == 'telnet') {
        await new Promise((resolve, reject) => {
          pyboard.waitForBlocking('Login as:', { resolve: resolve,
            reject: reject }, 7000);
        });

        this.receivedLoginAs = true;

        await pyboard.sendWait(pyboard.params.username, 'Password:', 7000);

        // timeout of 50 ms to be sure the board is ready to receive the password
        // Without this, sometimes connecting via the boards access point fails
        await utils.sleep(50);

        await pyboard.sendWait(pyboard.params.password,
          'Login succeeded!\r\nType "help()" for more information.\r\n',
          7000);
      }
      else {
        throw 'Not a telnet connection, no login needed';
      }
    }
    catch (err) {
      this._stoppedRunning();
      throw err;
    }
  }

  _stoppedRunning() {
    this.running = false;
    this.receivedLoginAs = false;
  }
}
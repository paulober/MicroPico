import Utils from '../utils';
import Pyboard from './pyboard';

export default class Authorize {
  private board: Pyboard;
  private running: boolean;
  private recivedLoginAs: boolean;

  constructor(board: Pyboard) {
    this.board = board;
    this.running = false;
    this.recivedLoginAs = false;
  }

  public async run() {
    let pyboard = this.board;
    this.running = true;

    try {
      if (pyboard.connection?.type === 'telnet') {
        await new Promise((resolve, reject) => {
          pyboard.waitForBlocking(
            'Login as:',
            { resolve: resolve, reject: reject },
            7000
          );
        });

        this.recivedLoginAs = true;

        await pyboard.sendWait(pyboard.params?.username!, 'Password:', 7000);

        // timeout of 50 ms to be sure the board is ready to receive the password
        // Without this, sometimes connecting via the boards access point fails
        await Utils.sleep(50);

        await pyboard.sendWait(
          pyboard.params?.password!,
          'Login succeeded!\r\nType "help()" for more information.\r\n',
          7000
        );
      } else {
        throw new Error('Not a telnet connection, no login needed');
      }
    } catch (err) {
      this.stoppedRunning();
      throw err;
    }
  }

  private stoppedRunning() {
    this.running = false;
    this.recivedLoginAs = false;
  }
}

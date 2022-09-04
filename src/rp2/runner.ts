import ApiWrapper from '../apiWrapper';
import SerialDolmatcher from '../serialDolmatcher';
import Term from '../terminal';
import Pyboard from './pyboard';

export default class Runner {
  private board: Pyboard;
  private terminal: Term;
  private serialDolmatcher: SerialDolmatcher;
  private api: ApiWrapper;
  private busy: boolean;

  constructor(
    pyboard: Pyboard,
    terminal: Term,
    serialDolmatcher: SerialDolmatcher
  ) {
    this.board = pyboard;
    this.terminal = terminal;
    this.serialDolmatcher = serialDolmatcher;
    this.api = new ApiWrapper();
    this.busy = false;
  }

  public async toggle(): Promise<void> {
    if (this.busy) {
      await this.stop();
    } else {
      await this.start();
    }
  }

  public async start(): Promise<void> {
    let currentFile = this.getCurrentFile();

    if (currentFile === undefined) {
      this.terminal.enter();
      this.terminal.writelnAndPrompt("A file isn't open in the editor.");
      return;
    }

    await this.board.softResetNoFollow();

    this.terminal.writeln('Running ' + currentFile.filename);
    this.busy = true;

    await this.board.run(currentFile.content);
    this.busy = false;
  }

  public async selection(
    codeblock: string,
    hideMessage = false
  ): Promise<void> {
    codeblock = this.trimcodeblock(codeblock);
    if (!hideMessage) {
      this.terminal.writeln('Running selected lines');
    }
    this.busy = true;

    try {
      await this.board.run(codeblock);
      this.busy = false;
    } catch (err: any) {
      if (err instanceof Error) {
        this.terminal.writelnAndPrompt(err.message);
      } else {
        this.terminal.writelnAndPrompt(err as string);
      }
    }
  }

  public async stop(): Promise<void> {
    if (this.busy) {
      await this.board.stopRunningProgramsNoFollow();
      await this.board.flush();
      await this.board.enterFriendlyRepl();
      this.terminal.enter();
      this.terminal.write('>>> ');
      this.busy = false;
    }
  }

  private getCurrentFile() {
    let file = this.api.getOpenFile();

    if (!file || !file.content) {
      return;
    }

    let filename: string | undefined = 'untitled file';
    if (file.path) {
      // was pop(-1) but that's wrong says the linter
      filename = file.path.split('/').pop();
      // was pop(-1) but that was wrong as linting would complain
      let filetype: string | undefined = filename?.split('.').pop();
      if (filetype?.toLowerCase() !== 'py') {
        return;
      }
    }

    return {
      content: file.content,
      filename: filename,
    };
  }

  //remove excessive identation
  private trimcodeblock(codeblock: string) {
    // regex to split both win and unix style
    let lines = codeblock.match(/[^\n]+(?:\r?\n|$)/g);
    // count leading spaces in line1 ( Only spaces, not TAB)
    let count = 0;
    if (lines) {
      while (lines[0].startsWith(' ', count)) {
        count++;
      }

      // remove from all lines
      if (count > 0) {
        let prefix = ' '.repeat(count);
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith(prefix)) {
            lines[i] = lines[i].slice(count);
          } else {
            // funky identation or selection; just trim spaces and add warning
            lines[i] = lines[i].trim() + ' # <- IndentationError';
          }
        }
      }
      // glue the lines back together
      return lines.join('');
    }
    return codeblock;
  }
}

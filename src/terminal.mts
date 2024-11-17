import { commands, EventEmitter } from "vscode";
import type { Pseudoterminal, Event, TerminalDimensions } from "vscode";
import History from "./models/history.mjs";
import { OperationResultType, PicoMpyCom } from "@paulober/pico-mpy-com";
import { commandPrefix } from "./api.mjs";

const PROMPT = ">>> ";
const DEL = (count: number): string => `\x1b[${count}D\x1b[1P`;
// Ctrl+D; Ctrl+E
const IGNORED_CHARS = ["\x04", "\x05"];

interface TerminalState {
  buffer: string;
  multilineMode: boolean;
  indentation: number;
  xCursor: number;
  waitingForPrompt: boolean;
}

/**
 * A pseudo terminal (aka vREPL) so the serial connection can be used by
 * other parts of the extension while the user isn't executing a command in the REPL.
 */
export class Terminal implements Pseudoterminal {
  private openingMessageCallback: () => Promise<string>;

  private writeEmitter = new EventEmitter<string>();
  private closeEmitter = new EventEmitter<void | number>();
  private submitEmitter = new EventEmitter<string>();
  private tabCompEmitter = new EventEmitter<string>();
  private isOpen = false;
  private state: TerminalState = {
    buffer: "",
    multilineMode: false,
    indentation: 0,
    xCursor: 0,
    waitingForPrompt: false,
  };
  private backupState?: TerminalState;
  private history: History = new History();
  private controlSequence = false;
  private isFrozen = false;
  private awaitingCloseOp = false;

  onDidWrite: Event<string> = this.writeEmitter.event;
  onDidClose: Event<void | number> = this.closeEmitter.event;
  onDidSubmit: Event<string> = this.submitEmitter.event;
  onDidRequestTabComp: Event<string> = this.tabCompEmitter.event;

  constructor(openingMessageCallback: () => Promise<string>) {
    this.openingMessageCallback = openingMessageCallback;
  }

  public open(initialDimensions: TerminalDimensions | undefined): void {
    if (this.isOpen && initialDimensions !== undefined) {
      return;
    }

    this.isOpen = true;
    this.isFrozen = false;

    this.callOpeningCb();
  }

  public callOpeningCb(): void {
    //this.writeEmitter.fire("\x1b[1;32mWelcome to the Virtual REPL!\x1b[0m\r\n");
    //this.writeEmitter.fire("Enter a message and it will be echoed back:\r\n");
    void this.openingMessageCallback().then((message: string) => {
      this.writeEmitter.fire(message);
      this.prompt();
      //this.writeEmitter.fire(PROMPT);
      if (this.isFrozen) {
        this.melt();
      }
    });
  }

  // signal that a close call should be ignored
  public awaitClose(): void {
    this.awaitingCloseOp = true;
  }

  public close(): void {
    if (this.awaitingCloseOp) {
      this.awaitingCloseOp = false;

      return;
    }
    this.isOpen = false;
    // clear history
    this.history.clear();
  }

  public freeze(): void {
    this.isFrozen = true;

    this.clean(false);
  }

  public clean(waitingForPrompt?: boolean): void {
    this.state.waitingForPrompt =
      waitingForPrompt ?? this.state.waitingForPrompt;

    this.state.buffer = "";
    this.state.multilineMode = false;
    this.state.indentation = 0;
    this.state.xCursor = 0;
  }

  public melt(): void {
    this.isFrozen = false;
  }

  private getRelativeCursor(): number {
    let relativeCursor = this.state.xCursor;
    if (this.state.multilineMode) {
      const currentLineLength = this.state.buffer.split("\n").pop()?.length;
      if (currentLineLength === undefined) {
        return -1;
      }
      relativeCursor =
        this.state.xCursor + (this.state.buffer.length - currentLineLength);
    }

    return relativeCursor;
  }

  public handleInput(data: string): void {
    if (!this.isOpen || this.isFrozen) {
      return;
    }

    for (const char of data) {
      if (this.controlSequence) {
        this.controlSequence = false;

        if (data === "\x1b[A") {
          // arrow up
          const historyItem = this.history.arrowUp();
          // delete until last save positon
          this.writeEmitter.fire("\x1b[u\x1b[0J");
          this.state.buffer = historyItem;
          this.state.xCursor = this.state.buffer.length;
          this.writeEmitter.fire(this.state.buffer);
        } else if (data === "\x1b[B") {
          // arrow down
          const historyItem = this.history.arrowDown();
          // delete until last save positon
          this.writeEmitter.fire("\x1b[u\x1b[0J");
          this.state.buffer = historyItem;
          this.state.xCursor = this.state.buffer.length;
          this.writeEmitter.fire(this.state.buffer);
        } else if (data === "\x1b[C") {
          // arrow right
          if (this.state.xCursor < this.state.buffer.length) {
            this.state.xCursor++;
            this.writeEmitter.fire("\x1b[1C");
          }
        } else if (data === "\x1b[D") {
          // arrow left
          if (
            this.state.xCursor > 0 &&
            (!this.state.multilineMode ||
              this.state.indentation < this.state.xCursor)
          ) {
            this.state.xCursor--;
            this.writeEmitter.fire("\x1b[1D");
          }
        } else if (
          data === "\x1b[3~" &&
          this.state.xCursor < this.state.buffer.split("\n")[-1].length
        ) {
          // delete
          this.writeEmitter.fire("\x1b[0K");
          // delete the character (if any) right of the cursor, index of which will be xCursor
          this.state.buffer =
            this.state.buffer.slice(0, this.state.xCursor) +
            this.state.buffer.slice(this.state.xCursor + 1);
        }

        break;
      }

      if (char === "\r") {
        // don't allow multiline imput while we're waiting for a prompt
        if (!this.state.waitingForPrompt) {
          this.checkMultilineMode();
        }

        if (
          this.state.multilineMode &&
          this.state.buffer.split("\n").pop()?.trim() === ""
        ) {
          this.state.multilineMode = false;
          this.processMultilineInput();
          this.state.buffer = "";
          this.state.xCursor = 0;
        } else {
          if (!this.state.multilineMode) {
            if (this.state.buffer === "") {
              this.writeEmitter.fire("\r\n");
              this.prompt();
            } else {
              this.processInput(this.state.buffer);
            }
            this.state.buffer = "";
            this.state.xCursor = 0;
          } else {
            this.state.buffer += "\n";
            this.writeEmitter.fire("\r\n");
            this.handleIndentation();
          }
        }
      } else if (char === "\x7f") {
        // Backspace
        this.handleBackspace();
      } else if (char === "\x1b") {
        // Escape
        this.controlSequence = true;
      } else if (char === "\x03") {
        // Ctrl+C
        if (!this.state.waitingForPrompt) {
          return;
        }

        this.submitEmitter.fire(char);
      } else if (char === "\t") {
        if (this.state.multilineMode) {
          // Tab is treated as 4 spaces in multiline mode and not
          // for autocompletion like in normal mode
          this.handleInput("    ");
        } else {
          // Tab
          this.handleTab();
        }
      } else if (char === "\x16") {
        // Ctrl+V
        commands.executeCommand("editor.action.clipboardPasteAction");
      } else {
        if (IGNORED_CHARS.includes(char)) {
          return;
        }

        const relativeCursor = this.getRelativeCursor();
        if (relativeCursor === -1) {
          return;
        }

        // this.state.buffer += char; for xCursor
        this.state.buffer =
          this.state.buffer.slice(0, relativeCursor) +
          char +
          this.state.buffer.slice(relativeCursor);
        // if xCursor is not at the end of the row
        if (relativeCursor < this.state.buffer.length) {
          // shift the rest of the row to the right, to don't overwrite it
          this.writeEmitter.fire("\x1b[1@");
        }
        this.writeEmitter.fire(char);
        this.state.xCursor++;
      }
    }
  }

  private handleIndentation(): void {
    const lastLine = this.state.buffer.split("\n").slice(-2)[0];
    if (lastLine.trim().endsWith(":")) {
      this.state.indentation += 4;
      this.state.xCursor = this.state.indentation;
    }
    const indentStr = " ".repeat(this.state.indentation);
    this.writeEmitter.fire(indentStr);
    this.state.buffer += indentStr;
  }

  private handleBackspace(): void {
    const currentLine = this.state.buffer.split("\n").pop();

    if (currentLine === undefined) {
      return;
    }

    if (
      this.state.multilineMode &&
      this.state.indentation > 0 &&
      currentLine?.length === this.state.indentation &&
      currentLine.trim() === ""
    ) {
      this.state.indentation -= 4;
      this.state.xCursor -= 4;

      // Remove the last 4 characters from the buffer
      this.state.buffer = this.state.buffer.slice(0, -4);
      this.writeEmitter.fire(DEL(4));
    } else if (currentLine.length > 0) {
      const relativeCursor = this.getRelativeCursor();
      if (relativeCursor === -1) {
        return;
      }

      // Remove the last character from the buffer at relativeCursor-1
      this.state.buffer =
        this.state.buffer.slice(0, relativeCursor - 1) +
        this.state.buffer.slice(relativeCursor);
      this.state.xCursor--;
      this.writeEmitter.fire(DEL(1));
    }
  }

  private handleTab(): void {
    if (this.state.buffer === "") {
      return;
    }
    // move cursor into next line
    this.writeEmitter.fire("\r\n");

    this.tabCompEmitter.fire(this.state.buffer);
  }

  private checkMultilineMode(): void {
    const multilineKeywords = [
      "def",
      "while",
      "for",
      "if",
      "elif",
      "else",
      "with",
      "class",
      "try",
      "except",
      "finally",
    ];
    const lastLine = this.state.buffer.split("\n").pop() ?? "";
    if (!this.state.multilineMode) {
      this.state.multilineMode = multilineKeywords.some(keyword =>
        lastLine.trim().startsWith(keyword)
      );
    }
  }

  public cls(): void {
    this.writeEmitter.fire("\x1b[2J\x1b[0f");
  }

  private processInput(input: string): void {
    /*if (input === "exit") {
      this.writeEmitter.fire("\r\nExiting...\r\n");
      this.closeEmitter.fire(0);
    }*/
    //this.writeEmitter.fire(`\r\nYou entered: \x1b[1;33m${input}\x1b[0m\r\n`);
    if (input === ".cls" || input === ".clear") {
      this.cls();
      this.open(undefined);

      return;
    } else if (input === ".empty") {
      this.cls();
      this.prompt();

      return;
    } else if (input === ".ls") {
      this.writeEmitter.fire("\r\n");
      this.state.waitingForPrompt = true;
      this.history.add(input);
      this.submitEmitter.fire("import uos; uos.listdir()\n");

      return;
    } else if (input === ".rtc") {
      this.writeEmitter.fire("\r\n");
      this.state.waitingForPrompt = true;
      this.history.add(input);
      PicoMpyCom.getInstance()
        .getRtcTime()
        .then(time => {
          if (time.type === OperationResultType.getRtcTime) {
            this.writeEmitter.fire(
              `RTC time: ${time.time ? time.time.toLocaleString() : "N/A"}\r\n`
            );
            this.prompt();
          } else {
            // log in red
            this.writeEmitter.fire(
              "\x1b[1;31mError getting RTC time\x1b[0m\r\n"
            );
            this.prompt();
          }
        })
        .catch(() => {
          // log in red
          this.writeEmitter.fire("\x1b[1;31mError getting RTC time\x1b[0m\r\n");
          this.prompt();
        });

      return;
    } else if (input === ".sr") {
      void commands.executeCommand(commandPrefix + "reset.soft.listen");

      return;
    } else if (input === ".hr") {
      void commands.executeCommand(commandPrefix + "reset.hard.listen", true);
      this.writeEmitter.fire("\r\n");

      return;
    } else if (input === ".gc") {
      void commands.executeCommand(commandPrefix + "garbageCollect");
      this.writeEmitter.fire("\r\n");
      this.prompt();

      return;
    } else if (input === ".help") {
      this.writeEmitter.fire("\r\n");
      this.writeEmitter.fire("Available vREPL commands:\r\n");
      this.writeEmitter.fire(".cls/.clear - clear screen and prompt\r\n");
      this.writeEmitter.fire(".empty - clean vREPL\r\n");
      this.writeEmitter.fire(".ls - list files on Pico\r\n");
      this.writeEmitter.fire(".rtc - get the time form the onboard RTC\r\n");
      this.writeEmitter.fire(".sr - soft reset the Pico\r\n");
      this.writeEmitter.fire(".hr - hard reset the Pico\r\n");
      this.writeEmitter.fire(".gc - trigger garbage collector\r\n");

      this.writeEmitter.fire(".help - show this help\r\n");
      this.prompt();

      return;
    }

    if (this.state.waitingForPrompt) {
      // delete input as input(...) in repl echos input back
      this.writeEmitter.fire(DEL(input.length));
    } else {
      this.writeEmitter.fire("\r\n");
    }

    this.state.waitingForPrompt = true;
    this.history.add(input);
    this.submitEmitter.fire(input + "\n");
  }

  private processMultilineInput(): void {
    //this.writeEmitter.fire("\nMultiline input submitted\r\n");
    this.state.indentation = 0;
    this.writeEmitter.fire("\r\n");
    this.state.waitingForPrompt = true;
    this.history.add(this.state.buffer);
    this.submitEmitter.fire(this.state.buffer);
  }

  public write(data: string): void {
    this.writeEmitter.fire(data);
  }

  public prompt(withoutPrint = false): void {
    this.state.waitingForPrompt = false;
    if (!withoutPrint) {
      this.writeEmitter.fire(PROMPT);
    }
    // save cursor positon
    this.writeEmitter.fire("\x1b7");
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }

  private clearState(): void {
    this.state = {
      buffer: "",
      multilineMode: false,
      indentation: 0,
      xCursor: 0,
      waitingForPrompt: false,
    };
  }

  /**
   * Clean the terminal and store the current state (not submitted input).
   *
   * Can be used in combination with restore to keep the terminal state
   * during an external operation.
   */
  public cleanAndStore(): void {
    this.backupState = { ...this.state };
    // delete until last save positon
    this.writeEmitter.fire("\x1b[u\x1b[0J");
    this.clean(true);
    this.writeEmitter.fire("\r\n");
  }

  /**
   * Restore the terminal state after an external operation.
   *
   * (does trigger prompt and newline for you)
   */
  public restore(): void {
    // check if last content is prompt
    this.writeEmitter.fire("\r\n");
    this.prompt();
    if (this.backupState !== undefined) {
      this.clearState();

      // write buffer
      /*for (const char of this.backupState.buffer) {
        this.handleInput(char);
      }*/
      this.state = { ...this.backupState };
      this.writeEmitter.fire(this.state.buffer);
      this.backupState = undefined;
    }
  }
}

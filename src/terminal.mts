import {
  Pseudoterminal,
  EventEmitter,
  Event,
  TerminalDimensions,
} from "vscode";

const PROMPT = ">>> ";
const DEL = (count: number) => `\x1b[${count}D\x1b[0K`;

export class Terminal implements Pseudoterminal {
  private writeEmitter = new EventEmitter<string>();
  private closeEmitter = new EventEmitter<void | number>();
  private isOpen = false;
  private buffer = "";
  private multilineMode = false;
  private indentation = 0;

  onDidWrite: Event<string> = this.writeEmitter.event;
  onDidClose: Event<void | number> = this.closeEmitter.event;

  constructor() {}

  public open(initialDimensions: TerminalDimensions | undefined): void {
    this.isOpen = true;
    this.writeEmitter.fire("\x1b[1;32mWelcome to the Virtual REPL!\x1b[0m\r\n");
    this.writeEmitter.fire("Enter a message and it will be echoed back:\r\n");
    this.writeEmitter.fire(PROMPT);
  }

  public close(): void {
    this.isOpen = false;
  }

  public handleInput(data: string): void {
    if (!this.isOpen) return;

    for (const char of data) {
      if (char === "\r") {
        if (this.buffer.split("\n").pop()?.trim() === "") {
          this.multilineMode = false;
          this.processMultilineInput();
          this.buffer = "";
        } else {
          if (!this.multilineMode) {
            this.processInput(this.buffer);
            this.buffer = "";
          } else {
            this.buffer += "\n";
            this.writeEmitter.fire("\r\n");
            this.handleIndentation();
          }
        }
      } else if (char === "\x7f") {
        this.handleBackspace();
      } else {
        this.buffer += char;
        this.writeEmitter.fire(char);
        this.checkMultilineMode();
      }
    }
  }

  private handleIndentation(): void {
    const lastLine = this.buffer.split("\n").slice(-2)[0];
    if (lastLine.trim().endsWith(":")) {
      this.indentation += 4;
    }
    const indentStr = " ".repeat(this.indentation);
    this.writeEmitter.fire(indentStr);
    this.buffer += indentStr;
  }

  private handleBackspace(): void {
    const currentLine = this.buffer.split("\n").pop();

    if (currentLine === undefined) return;

    if (
      this.multilineMode &&
      this.indentation > 0 &&
      currentLine?.length === this.indentation &&
      currentLine.trim() === ""
    ) {
      this.indentation -= 4;

      // Remove the last 4 characters from the buffer
      this.buffer = this.buffer.slice(0, -4);
      this.writeEmitter.fire(DEL(4));
    } else if (currentLine!.length > 0) {
      // Remove the last character from the buffer
      this.buffer = this.buffer.slice(0, -1);
      this.writeEmitter.fire(DEL(1));
    }
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
    const lastLine = this.buffer.split("\n").pop() || "";
    if (!this.multilineMode) {
      this.multilineMode = multilineKeywords.some(keyword =>
        lastLine.trim().startsWith(keyword)
      );
    }
  }

  private processInput(input: string): void {
    if (input === "exit") {
      this.writeEmitter.fire("\r\nExiting...\r\n");
      this.closeEmitter.fire(0);
    } else {
      this.writeEmitter.fire(`\r\nYou entered: \x1b[1;33m${input}\x1b[0m\r\n`);
      this.writeEmitter.fire(PROMPT);
    }
  }

  private processMultilineInput(): void {
    this.writeEmitter.fire("\nMultiline input submitted\r\n");
    this.indentation = 0;
    this.writeEmitter.fire(PROMPT);
  }
}

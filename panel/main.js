/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

(function () {
    const vscode = acquireVsCodeApi();

    const terminal = document.getElementById("terminal");
    const inputField = document.getElementById("input-field");
    const submitButton = document.getElementById("submit-button");

    var term = new Terminal({
        // Enable 256-color mode
        theme: {
            foreground: '#cccccc',
            background: 'rgba(0,0,0,0)',
            cursor: 'rgba(248,28,229,0.8)',
            cursorAccent: '#000000',
            selectionBackground: 'rgba(42,134,175,0.3)',
            selectionForeground: '#ffffff',
            selectionInactiveBackground: 'rgba(42,134,175,0.1',
            black: '#000000',
            red: '#ff0000',
            green: '#00ff00',
            yellow: '#ffff00',
            blue: '#0000ff',
            magenta: '#ff00ff',
            cyan: '#00ffff',
            white: '#ffffff',
            brightBlack: '#808080',
            brightRed: '#ff0000',
            brightGreen: '#00ff00',
            brightYellow: '#ffff00',
            brightBlue: '#0000ff',
            brightMagenta: '#ff00ff',
            brightCyan: '#00ffff',
            brightWhite: '#ffffff',
            extendedAnsi: [
                '#000000', '#800000', '#008000', '#808000', '#000080',
                '#800080', '#008080', '#c0c0c0', '#808080', '#ff0000',
                '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff',
                '#ffffff',
                // Add more extended ANSI colors as needed (up to index 255)
            ],
        },
        allowTransparency: true, // Enable true color (24-bit) mode
        cursorBlink: true
    });
    term.open(terminal);
    //term.setOption('cursorBlink', true);

    function writeToTerminal(text) {
        //const p = document.createElement("p");
        //p.textContent = text;
        //terminal.appendChild(p);
        term.write(text);
    }

    // Handle user input and display it in the terminal
    function handleInput() {
        const command = inputField.value;
        //writeToTerminal("> " + command);
        vscode.postMessage({ type: 'commandSubmit', content: command });
        inputField.value = ""; // Clear the input field
        // You can execute the command here or process it as needed
    }

    submitButton.addEventListener("click", handleInput);
    inputField.addEventListener("keydown", (event) => {
        event.preventDefault();
    });
    inputField.addEventListener("keyup", (event) => {
        /*if (event.key === "Enter") {
            handleInput();
        }*/
        vscode.postMessage(
            {
                type: 'keyup',
                content: keyToSequence(event.key)
            });
    });

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'input':
                {
                    writeToTerminal(message.data);
                    break;
                }
        }
    });

    function keyToSequence(key) {
        switch (key) {
            case 'ArrowUp':
                return '\x1b[A';
            case 'ArrowDown':
                return '\x1b[B';
            case 'ArrowLeft':
                return '\x1b[D';
            case 'ArrowRight':
                return '\x1b[C';
            case 'Tab':
                return '\t';
            case 'Enter':
                return '\r';
            case 'Escape':
                return '\x1b';
            case 'Backspace':
                //return '\x08';
                return '\x7f';
            case 'Shift':
                return '';
            case 'AltGraph':
                return '';
            // Add more mappings as needed
            default:
                // Return the original key if no mapping is found
                return key;
        }
    }
}());

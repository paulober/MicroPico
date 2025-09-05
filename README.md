# MicroPico Visual Studio Code Extension (aka Pico-W-Go)

**New Feature:** Experimental `ESP32-WROOM`, `ESP32-C3`, `ESP32-S3`, `ESP32-S3-Pico` and `Teensy 4.0` support! (_Use the `Switch Stubs` command to get auto-completion for the `ESP32` port of MicroPython._)

**MicroPico** is a Visual Studio Code extension designed to simplify and accelerate the development of MicroPython projects for the Raspberry Pi Pico and Pico W boards. This tool streamlines the coding process, providing code highlighting, auto-completion, code snippets, and project management features, all tailored for the seamless development experience with MicroPython on Raspberry Pi Pico and Pico W microcontrollers.

> __Included auto-completion based on Raspberry Pi Pico W MicroPython firmware: [RPI_PICO2_W-20250809-v1.26.0.uf2](https://micropython.org/resources/firmware/RPI_PICO2_W-20250809-v1.26.0.uf2) from the [micropython-stubs project](https://github.com/Josverl/micropython-stubs)__

Works with:
| Platform | x86 | arm64 | armhf |
| :------- | :-: | :---: | :---: |
| Windows  | ✅   | ❌     | ⚠️     |
| macOS    | ✅   | ✅     | ❌     |
| Linux    | ✅   | ✅     | ⚠️      |

> ⚠️ _Included but unsupported_

## Features

- Auto-completion with docs
- Pseudo terminal integration for communication with MicroPython REPL on a Pico board (with support for tab-completion)
- Running / Transferring files to / from your board
- Built-in virtual-workspace provider for Raspberry Pi Pico boards (does disable Pylance auto-completion)
- Switch between auto-completion and IntelliSense for MicroPython ports `RPi Pico`, `RPi Pico (W)` and `ESP32` (requires pip installed an in PATH)
- Device Manager UI for managing wifi connection and installing mip packages (only on `Pico W`; experimental)
- `ESP32-WROOM-32`, `ESP32-C3`, `ESP32-S3`, `ESP32-S3-Pico` and `Teensy 4.0` support (experimental)

![Preview](images/preview.gif)

## Requirements

* [Visual Studio Code v1.92.1 or newer](https://code.visualstudio.com/Download)
* [Python 3.10 or newer](https://www.python.org/downloads/)

* [MicroPython firmware](https://micropython.org/download) flashed onto the Raspberry Pi Pico:
    - See [Raspberry Pi docs](https://www.raspberrypi.com/documentation/microcontrollers/micropython.html#drag-and-drop-micropython) for help.

Visual Studio Code extensions:
* `ms-python.python` | [\[Install\]](vscode://extension/ms-python.python) [\[Show\]](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
* `visualstudioexptteam.vscodeintellicode` | [\[Install\]](vscode://extension/visualstudioexptteam.vscodeintellicode) [\[Show\]](https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.vscodeintellicode)
* `ms-python.vscode-pylance` | [\[Install\]](vscode://extension/ms-python.vscode-pylance) [\[Show\]](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance)

Environment (Linux only):

On most Linux installations the device file of the Pico serial port is owned by root and a group you normal don't have by default (*except on Raspberry Pi OS*). This leads to timeout and access denied errors when MicroPico tries to connect to the Pico. There are three ways how to solve this problem:
- See [Wiki | Linux](https://github.com/paulober/MicroPico/wiki/Linux) for a small guide

## Getting started

- First of all open a folder and run `> MicroPico > Initialize MicroPico Project` command via `Ctrl+Shift+P` (or the equivalent on your platform) VS Code command palette. This will import stubs for autocompletion and the settings into your project folder. For the autocompletion to work, the extension prompts you (after project configuration) to install recommended extensions mentioned in [\#Requirements](#requirements).

- Have the onboard LED flashing in under 5 minutes:

```python
from machine import Pin
from utime import sleep

pin = Pin("LED", Pin.OUT)

print("LED starts flashing...")
while True:
    try:
        pin.value(not pin.value())
        sleep(1) # sleep 1sec
    except KeyboardInterrupt:
        break
pin.off()
print("Finished.")
```

- To run your program, run `> MicroPico > Run current file on Pico` in your Python file's tab. You can also use the status bar button "Run " at the bottom of VS Code window.

- To stop the execution of the currently running program or other operation, run `> MicroPico > Stop execution`. The "Stop" button at the status bar does the same.

---

## Extension Settings

This extension contributes the following settings:

* `micropico.autoConnect`: Ignores any 'device address' setting and automatically connects to the top item in the serial-port list (of Picos).
* `micropico.manualComDevice`: If `autoConnect` is set to false MicroPico will automatically connect to the serial port specified here.
* `micropico.syncFolder`: This folder will be uploaded to the pyboard when using the upload-project command/button. Leave empty to sync the complete project. (only allows folders within the project). Use a path relative to the project you opened in vscode, without leading or trailing slash.
* `micropico.additionalSyncFolders`: Specifies additional folders that can be selected as upload sources when uploading a project. If left empty, the sync will be performed based on the folder specified in the 'syncFolder' setting. Only folders within the project are allowed. Specify the path relative to the project you have opened in Visual Studio Code, without a leading or trailing slash.
* `micropico.syncAllFileTypes`: If enabled, all files will be uploaded no matter the file type. The list of file types below will be ignored.
* `micropico.syncFileTypes`: All types of files that will be uploaded to the board, seperated by comma. All other filetypes will be ignored during an upload (or download) action.
* `micropico.pyIgnore`: Comma separated list of files and folders to ignore when uploading relative to syncFolder (no wildcard or regular expressions supported except `**/<file|folder>` to exclude an item by its name in every sub folder). Use `<additionalSyncFolder>:file/to/exclude.py` to create sync folder exclusive exclusion rules (all other rules will always be applied relative to the selected sync folder). Replace `additionalSyncFolder` with a value from your `micropico.additionalSyncFolders` setting or the value from `micropico.syncFolder`.
* `micropico.openOnStart`: Automatically open the MicroPico terminal (Pico (W) vREPL) and connect to the board after starting VS Code.
* `micropico.statusbarButtons`: Select which buttons to show in the statusbar (DO NOT CHANGE, unless you know what you are doing)
* `micropico.gcBeforeUpload`: Run garbage collection before uploading files to the board. This will free up some memory usefull when uploading large files but adds about a second or two to the upload process.
* `micropico.softResetAfterUpload`: Soft-resets your board after any upload action. Usefull if you are developing with `main.py` or `boot.py`.
* `micropico.executeOnConnect`: Path to a MicroPython script on the Pico to execute on connect. Leave empty to disable. (must be relative to the root of the Pico's filesystem; doesn't need to begin with a slash; overrides `micropico.openOnStart` setting)
* `micropico.importOnConnect`: A MicroPython module to import in vREPL on connect. Leave empty to disable.
* `micropico.noSoftResetOnRun`: Disables the soft-resets before and after running a file on the Pico.

## Extension Context Keys

* `micropico.isActivated`: set when the extension is activated
* `micropico.isConnected`: set when the extension is connected to a Pico

---

### Note

+ For licensing purposes: Prior to version v3.0.0 of this extension the codebase was a fork of github.com/cpwood/Pico-Go which is a derivative product of Pymakr by Pycom Limited.

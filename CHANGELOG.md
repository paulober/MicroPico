# Change Log

All notable changes to the "pico-w-go" extension will be documented in this file.

>_Based on structure recommendations from [Keep a Changelog](http://keepachangelog.com/)._

## Known issues
- Run current file does not include modules that are localy imported and in current workspace, unless you upload the python file containing the module via the upload file or project feature first. (since ever)
- Mounting virtual workspace causes existing vREPLs to freeze (*sometimes*) so they need to be disposed manually for some reason. (maybe cauaused by vscode)
- Scripts without a print statement sometime causes the extension to freeze

---

## [3.0.8] - 2023-05-05

# Changed
- Fixes Python 3.9 compatibility
- Upgraded to pyboard-serial-com v1.4.24

## [3.0.7] - 2023-04-27

# Changed
- Download project progressbar title
- Updated stubs for 'Firmware v1.20.0 stable'

## [3.0.6] - 2023-04-26

# Changed
- `pyserial` is now auto-installed as requirement on start. If the installation/detection fails, the extension give feedback to the user.

## [3.0.5] - 2023-04-18

# Changed
- Updated README.md

## [3.0.4] - 2023-04-18

# Changed
- Increased timeout on pyserial and python version detection (PR #74)

## [3.0.3] - 2023-04-13

# Changed
- `rebootAfterUpload` default value to `false`
- Better error handling and more detailed error messages for 
- Upgraded to pyboard-serial-com v1.4.23

## [3.0.2] - 2023-04-11

# Added
- AutoConnect feature, the extension now detects disconnects and auto reconnects

# Changed
- Fixed `globalSettings` command
- Python detection now has a 1sec timeout

## [3.0.1] - 2023-04-11

# Changed
- Small UX improvements
- Fixes [#58](https://github.com/paulober/Pico-W-Go/issues/58), Run button no stop option

# Removes
- Artificial upload constraint ([#61](https://github.com/paulober/Pico-W-Go/issues/61))

## [3.0.0] - 2023-04-10

# Added
- Remote filesystem/workspace integration of the Pico (W) filesystem.
- A contributed/integrated __terminal profile__ for the Pico (W) REPL (open and closing does not affect the connection as long as you don't duplicated or open multiple vREPLs)

- `picowgo.switchPico` command to be able to chose between ports without having to deal with any config
- `picowgo.gcBeforeUpload` runs garbage collector before uploading files to free some memory for more stable uploads

# Changed
- `picowgo.syncFileTypes` settings datatype changed to `array`
- `picowgo.safeBootOnUpload` was renamed to `picowgo.gcBeforeUpload`
- NEW REQUIREMENT: [`pyserial`Python Pip package](https://pypi.org/project/pyserial/)
- Terminal behaviour is now a virtual REPL which can execute commands on the remote Pico (W) MicroPython REPL
- To enable the new remote workspace feature, a new queuing system between the serial port and the VSCode inputs had to be developed
to cope with the bottleneck of a *serial* connection. For stability reasons, I therefore do **not** recommend excessive multitasking with the features of the extension in conjunction with the Pico. It should work fine and also handle a large load, but you don't need to overuse it.
- Better detection for OS and hardware
- Improved stability for file transfers
- Updated stubs for 'Firmware v1.19.1-1009 nightly'
- Shrunk extension file size because it's not required to bundle serialport package anymore within the extension

# Removed 
- `ctrlCOnConnect` setting, because its now the default
- FTP-Server, it was deprecated had security vulnarabilities and some users reported problems using it
- Cut many other dependencies

---

## [2.1.8] - 2023-03-04

# Changed
- Improved `urequests.Response` class stubs to reflect runtime added fields (v1.19.1-915-1)

## [2.1.7] - 2023-03-03

# Changed
- Workaround for MicroPython filesystem reformat bug (Issues #46, #50) [PR: #49]
- Updated stubs to 'Firmware v1.19.1-915 nightly'

## [2.1.6] - 2023-02-03

# Changed
- Updated serialport and other dependencies

## [2.1.5] - 2023-01-15

# Changed
- Updated stubs to 'Firmware v1.19.1-796 unstable'

## [2.1.4] - 2022-12-20

### Changed
- Fixed #37, Fixed #37, Wrong char encoding in 'run current file' operation
- Updated stubs to 'Firmware v1.19.1-780 unstable'

## [2.1.3] - 2022-11-10

### Added
- Support for armv7 (32-bit) by providing a patch for the node-gyp-build dependency which should only be temp.

## [2.1.2] - 2022-10-31

### Changed
- Stubs hotfix v1.19.1-594-1 unstable

## [2.1.1] - 2022-10-27

### Changed
- Fixes #23, Configure project command does not link Stubs. By changing the type of the symbolic link from a directory link to a directory junction.
- Updated stubs to 'Firmware 1.19.1-594'

## [2.1.0] - 2022-09-24

### Added
- Colored terminal output to some message by the extension

### Changed
- Switched to VS Code api PseudoTerminal (pty) instead of the old terminalExec.py fake REPL
- Fixed some naming convention "errors"

### Removed
- terminalExec.py

## [2.0.8] - 2022-09-18

### Changed
- Fixes if you reopen VS Code via desktop or taskbar shortcut i sometimes restores old terminal sessions with then cannot be closed because the close action will always close the now working session.

## [2.0.7] - 2022-09-12

### Changed
- Updated stubs as of Firmware v1.19.1-389-1 unstable for the rp2 Pico-W board

## [2.0.6] - 2022-09-08

### Changed
- Updated stubs as of Firmware v1.19.1-378 unstable for the rp2 Pico-W board
- Fixed SyntaxError in deleteAllFiles command

## [2.0.5] - 2022-09-07

### Changed
- Updated stubs as of Firmware v1.19.1-375 unstable for the rp2 Pico-W board

## [2.0.4] - 2022-09-06
### Changed
- Fixes constantly crashing terminal on linux

## [2.0.3] - 2022-09-05
### Changed
- Fixed linting of builtin python features.

## [2.0.0] - 2022-09-04

### Added
- Following dependencies:
  - serialport v10+
  - webpack
  - webpack-cli
  - glob
- Patches for following packages:
  - dtrace-provider
  - ftp-srv
- `os` and `cpu` section to package.json
- Bugs URL into package.json
- Apache 2.0 license

### Changed
- Completly moved codebase to Typescript (rewrote many parts)
- Moved to serialport version 10.4.0 which now has integrated prebuild binaries from @serialport/bindings-cpp
- Extensive changes to the build system
- Integrated settings into vscode and removed pico-w-go.json settings files
- Cleaned up the default configuration of statusbar buttons by removing some of them to comply with vscode guidelines
- Fixed terminalExec.py script crashing thought function and special keys like 'arrow up' on Windows. It now suports all arrow key + the del key in the terminal and catches other special keys.
- Fixed license path in package.json for vscode
- Updated github build workflow
- Github issue templates/config
- Vscode activation events from `*` to custom command base activation and `.picowgo` file based activation

### Removed
- Duplicate functions
- Some unused code
- Following dependencies:
  - binascii
  - bindings
  - child-process-promise
  - commander
  - copy-paste
  - crypto-js
  - debug
  - element-resize-detector
  - lie
  - nan
  - ncp
  - node-abi
  - object.assign
  - ora
  - promirepl
  - prompt-list
  - rxjs
  - safe-buffer
  - spdx-correct
  - spdx-exceptions
  - telnet-client
  - utf8
  - xterm

  Dev-dependencies:
  - babel-cli
  - babel-core
  - babel-preset-es2015
  - chai
  - electron
  - electron-rebuild
  - prebuild-install
  - vscode
- 'Get Support Info' command

## ... cleared up older changelog
_can be found in older commit history_

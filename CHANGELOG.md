# Change Log

All notable changes to the "pico-w-go" extension will be documented in this file.

>_Based on structure recommendations from [Keep a Changelog](http://keepachangelog.com/)._

## Known issues
- Run current file does not include modules that are localy imported and in current workspace, unless you upload the python file containing the module via the upload file or project feature first. (since ever)
- CtrlCOnConnect settings does no rerender "Pico Disconnect" button correctly. Also does not enter repl correctly. Not impact on functionality just UI! (since v2.1.0)
- Some users have problems with stubs not linking into workspace after running "Configure Project". Maybe related to permission errors for symlink creation on these systems. As a workaround you can find a PowerShell script [here](https://github.com/paulober/Pico-W-Go/files/9651807/Configure-Project.zip) or in the repository contained folder called "scripts" named "Configure-Project.ps1". As an alternative often it does fix the issue by just running VS Code as an administrator (just to run the initial configure project command).

---

## [Unreleased]

- Remove telnet and unix socket interfaces as they are never used and unable to connect to any plain MicroPython Raspberry Pi Pico (W) board
- Mounting the MicroPython filesystem into VS Code as a remote workspace.

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

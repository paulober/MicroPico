# Change Log

All notable changes to the "pico-w-go" extension will be documented in this file.

>_Based on structure recommendations from [Keep a Changelog](http://keepachangelog.com/)._

## [Unreleased]

- Remove telnet and unix socket interfaces as they are never used and unable to connect to any plain MicroPython Raspberry Pi Pico (W) board

## [2.0.5] - 2022-09-07
### Known issues
- Sometimes if you were already connected to a board which has not been unpluged since than and you restart VS Code autoconnect does not go into REPL mode correctly
- Run current file does not include modules that are localy imported and in current workspace, unless you upload the python file containing the module via the upload file or project feature first.

### Changed
- Updated stubs as of Firmware v1.19.1-375 unstable for the rp2 Pico-W board 

## [2.0.4] - 2022-09-06
### Known issues
- Sometimes if you were already connected to a board which has not been unpluged since than and you restart VS Code autoconnect does not go into REPL mode correctly
- Run current file does not include modules that are localy imported and in current workspace, unless you upload the python file containing the module via the upload file or project feature first.
### Changed
- Fixes constantly crashing terminal on linux

## [2.0.3] - 2022-09-05
### Known issues
- Sometimes if you were already connected to a board which has not been unpluged since than and you restart VS Code autoconnect does not go into REPL mode correctly
- Run current file does not include modules that are localy imported and in current workspace, unless you upload the python file containing the module via the upload file or project feature first.
### Changed
- Fixed linting of builtin python features.

## [2.0.0] - 2022-09-04
### Known issues
- Sometimes if you were already connected to a board which has not been unpluged since than and you restart VS Code autoconnect does not go into REPL mode correctly
- Run current file does not include modules that are localy imported and in current workspace, unless you upload the python file containing the module via the upload file or project feature first.

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

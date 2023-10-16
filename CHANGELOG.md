# Change Log

All notable changes to the "MicroPico" extension will be documented in this file.

>_Based on structure recommendations from [Keep a Changelog](http://keepachangelog.com/)._

## Known issues
- vREPL tab-completion on Windows isn't inline. (that's also cool but different to macOS or Linux behaviour)
- Run current file does not include modules that are localy imported and in current workspace, unless you upload the python file containing the module via the upload file or project feature first. (since ever)

---

## [3.3.3] - 2023-10-16

# Changed
- Fixes an issue concerning multiline vREPL inputs
- Some minor improvemements

## [3.3.2] - 2023-10-16

# Changed
- Updated dependencies
- Upgraded to `pyboard-serial-com` `v2.0.1`
- Fixes Windows issues related to update `v3.3.0` (Fixes #143)

## [3.3.0] aka. [3.3.1] - 2023-10-11

# Changed
- Updated dependencies
- Upgraded to `pyboard-serial-com` `v2.0.0`
- Stubs updated to v1.21.0 stable

# Removed
- Dependency on the VS Code Python extension
- Dependency on `pyserial` pip package
- Dependency on Python being installed on the host system
- `micropico.pythonPath` setting
- Support for the armhf architecture

## [3.2.6] - 2023-10-01

# Added
- Fix #134, Support stopping execution with VS Code command (#13 by @eplusx)

# Changed
- Minimum VS Code version is now v1.82.0
- Updated dependencies

## [3.2.5] - 2023-09-04

# Changed
- Updated stubs to v1.20.0-441 unstable
- Minimum VS Code version is now v1.81.1
- Updated dependencies
- Added official Python extension as dependency

## [3.2.4] - 2023-08-16

# Changed
- Updated stubs to patch v1.20.0-5 stable

## [3.2.3] - 2023-08-15

# Changed
- Updated stubs to patch v1.20.0-4 stable (Fixes #125)

## [3.2.2] - 2023-08-14

# Added
- `uploadproject` status-bar button

# Changed
- Upgraded pyboard-serial-com to v1.5.3 (Fixes an issue where `pyIgnore` wildcard exclusions were not working)
- Updated stubs to patch v1.20.0-3 stable
- Dependencies were updated

## [3.2.1] - 2023-08-01

# Changed
- Rename extension to `MicroPico` but the ID remains the same: `paulober.pico-w-go` (for now)
- Dependencies update

## [3.2.0] - 2023-07-15

# Added
- `vscode:uninstall` script to remove Pico-W-Stub after extension gets uninstalled
- `picowgo.rtc.sync` command to sync the Pico's RTC with the host's time
- Fix #29, Add custom when clause context keys

# Changed
- Auto-detected Python3 commands are't automatically saved to global settings anymore to prevent erros when switching between different systems with different python installations and settings sync turned on
- Contributed menu entries are now only shown when the extension is active
- Updated dependencies

## [3.1.2] - 2023-06-22

# Added
- `picowgo.pyIgnore` now supports syncFolder specific rules

# Changed
- Fixed #111, Relative paths in `picowgo.pyIgnore` don't work
- Fixed #113, Unnecessary re-uploading of unchanged files during upload-project
- Upgraded pyboard-serial-com to v1.5.2

## [3.1.1] - 2023-06-21

# Changed
- Updated stubs to patch v1.20.0-2 stable

## [3.1.0] - 2023-06-20

# Added
- Logger output channel
- Open workspace settings command
- Added scopes to some configuration settings
- Added new `picowgo.additionalSyncFolders` setting (Requested in #40)
- Added `soft-reset (listen)` command. Soft-reset now displays output (read and write) of main.py and boot.py reruns after soft-reset with this new command or the updated `picowgo.softResetAfterUpload` setting. (Requested in #101)

# Changed
- Renamed setting `picowgo.rebootAfterUpload` to `picowgo.softResetAfterUpload`
- Fixed README table markdown for VS Code Marketplace store front
- Fix #71, Better up-/download progress notification/feedback
- vREPL now opens automatically on need (reduces "vREPL not open" warnings) (#60)
- All commands are now grouped in one category
- Some minor stability and performance improvements were made
- Fixed duplicate vREPL handling and not prompt on additional vREPL panel
- Fixed `input(...)` echoed back input in vREPL
- Other dependency updates
- Upgraded pyboard-serial-com to v1.5.1
- Bumped minimum NodeJS engine version to v16.17.1
- Updated stubs to patch v1.20.0-1 stable

## [3.0.14] - 2023-06-17

# Changed
- Fix #66, Problems with uploading/downloading a project
- Store listing improvements
- Upgrade to pyboard-serial-com v1.4.31
- Update terminal profile image

## [3.0.12] - 2023-06-15
## [3.0.11] - 2023-06-15

# Added
- vREPL now supports tab-completions (Requested in #102)

# Changed
- Logo remake (by an AI) upon advice
- Upgrade to pyboard-serial-com v1.4.30
- Fixes script needs print statement to be stoppable

## [3.0.10] - 2023-06-03

# Changed
- The minimum VSCode engine version was lowered to v1.76.0 for better compaibility with Raspberry Pi

## [3.0.9] - 2023-06-02

# Added
- Status Bar button `togglepicowfs` (Suggested in #95)

# Changed
- Fixed #73, Extension freezes when Pico is disconnected during code execution
- Upgrade to pyboard-serial-com v1.4.26

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

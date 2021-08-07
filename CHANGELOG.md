# Changelog

## [v1.4.3](https://github.com/cpwood/Pico-Go/tree/v1.4.3) (2021-08-07)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/v1.4.2...v1.4.3)

Fixes an incompatibility between serialport and VS Code 1.59.

**Fixed bugs:**

- Failure to load - VS Code 1.59 [\#97](https://github.com/cpwood/Pico-Go/issues/97)

## [v1.4.2](https://github.com/cpwood/Pico-Go/tree/v1.4.2) (2021-05-04)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/v1.4.1...v1.4.2)

Compatibility with VS Code 1.57.

**Implemented enhancements:**

- Support VS Code 1.57 - ASM 87 [\#88](https://github.com/cpwood/Pico-Go/issues/88)

## [v1.4.1](https://github.com/cpwood/Pico-Go/tree/v1.4.1) (2021-05-03)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/v1.4.0...v1.4.1)

Updated the stubs for [firmware v1.15.0](https://micropython.org/download/rp2-pico/) and fixed an issue with custom `sync_root` values.

**Implemented enhancements:**

- Update stubs for Firmware 1.15.0 [\#85](https://github.com/cpwood/Pico-Go/issues/85)

**Fixed bugs:**

- When sync\_root is customised, incorrectly told file cannot be transferred [\#86](https://github.com/cpwood/Pico-Go/issues/86)

## [v1.4.0](https://github.com/cpwood/Pico-Go/tree/v1.4.0) (2021-04-27)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/v1.3.1...v1.4.0)

This release fixes compatibility issues with the Microsoft Store version of Python on Windows. It also **removes all keybindings because of conflicts with out-of-the-box VS Code keybindings.**

This is a functional release; another minor release will be made very soon with updated stubs.

**Implemented enhancements:**

- Show Pico Pin Map - editor layout  [\#80](https://github.com/cpwood/Pico-Go/issues/80)

**Fixed bugs:**

- Disable Most Aggressive Keyboard Shortcut Thiefs [\#82](https://github.com/cpwood/Pico-Go/issues/82)
- Command 'picogo.initialise' not found after installing extension [\#79](https://github.com/cpwood/Pico-Go/issues/79)

## [v1.3.1](https://github.com/cpwood/Pico-Go/tree/v1.3.1) (2021-03-28)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/v1.3.0...v1.3.1)

Ability to set the Python path manuall, the COM port on a per-project basis and some UI refinements.

**Implemented enhancements:**

- Use standard message for confirmations; not quick-pick [\#73](https://github.com/cpwood/Pico-Go/issues/73)
- Ability to Select a different COM port when more than one Pico is connected [\#70](https://github.com/cpwood/Pico-Go/issues/70)
- Request more useful error message [\#69](https://github.com/cpwood/Pico-Go/issues/69)
- Support Anaconda managed environments [\#68](https://github.com/cpwood/Pico-Go/issues/68)

**Fixed bugs:**

- Unable to use PicoGo - Command palette commands not found, python3 not found [\#72](https://github.com/cpwood/Pico-Go/issues/72)

## [v1.3.0](https://github.com/cpwood/Pico-Go/tree/v1.3.0) (2021-03-15)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/v1.2.3...v1.3.0)

### FTP Server

The headline for this release is the [new in-built FTP server](http://pico-go.net/docs/start/quick/#managing-files-via-ftp) allowing you to manage the files on your Pico's board using your FTP client of choice. This might be something like FileZilla, a broader file management application, or even a VS Code extension. Follow the link above to get started.

### Firmware Updates

You can also now check whether you have the latest stable firmware release from the Command Palette: choose `Pico-Go > Help > Check for firmware updates`. If an update is available, you can click to start the download to your computer. Apply the downloaded file to your Pico in the usual way.

### Status Bar

You'll notice some changes to the status bar in this release: buttons will disappear when they're not available to use. For example, the ability to upload or download files won't be shown when you're in the middle of running some code that hasn't finished yet.

Additionally, Pico-Go now has a "universal stop button". Whether you're trying to stop your code, cancel a file transfer or close down the FTP server, it's the same button for all of the above! This will appear automatically when something is in progress and disappear once it's stopped.

### Leaner and Meaner

Finally, this version won't take as long to download! It looks like the original Pymakr code we inherited included a dependency on Electron (i.e. aside from the one used by VS Code). This meant the total package size was _well_ over 100MB. It was unnecessary and has been removed, and the package size is around 20MB!

### The road ahead..

From here onward, the focus will be on bug-fixing and polish rather than significant change. I feel the product scope is about right now; it's all about smoothing rough edges and keeping the auto-completion and linting up-to-date from here.

Enjoy!


**Implemented enhancements:**

- Check for firmware updates [\#61](https://github.com/cpwood/Pico-Go/issues/61)
- Universal stop button / hiding buttons when not available [\#59](https://github.com/cpwood/Pico-Go/issues/59)
- Manage files on your Pico via FTP [\#55](https://github.com/cpwood/Pico-Go/issues/55)

**Fixed bugs:**

- Electron and Electron-Rebuild are included as dependencies; shouldn't be! [\#63](https://github.com/cpwood/Pico-Go/issues/63)
- Window reload leaves a broken terminal behind [\#62](https://github.com/cpwood/Pico-Go/issues/62)
- Error raised when Run is clicked and no file is open [\#60](https://github.com/cpwood/Pico-Go/issues/60)

## [v1.2.3](https://github.com/cpwood/Pico-Go/tree/v1.2.3) (2021-03-13)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/v1.2.2...v1.2.3)

Fixes a conflict that could arise where Python 2 and 3 are both installed on the same machine.

**Fixed bugs:**

- Unable to start terminal | terminated with exit code 1. [\#57](https://github.com/cpwood/Pico-Go/issues/57)

## [v1.2.2](https://github.com/cpwood/Pico-Go/tree/v1.2.2) (2021-03-08)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/v1.2.1...v1.2.2)

This fixes a huge CPU load issue introduced by the new Python-based terminal proxy and also ensures `print()` statements are returned to the Pico Console in real time, as opposed to only at the end of executing.


**Fixed bugs:**

- Reduce CPU load of Python terminal implementation [\#52](https://github.com/cpwood/Pico-Go/issues/52)
- Pico Console not updating at runtime with print\(\) statements [\#51](https://github.com/cpwood/Pico-Go/issues/51)

## [v1.2.1](https://github.com/cpwood/Pico-Go/tree/v1.2.1) (2021-03-06)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/v1.2.0...v1.2.1)

This release removes the dependency on Node JS being installed on the computer (aside from the version included with Electron). It also fixes something that really ought to have been fixed in v1.2.0: when running a file, a soft reset will be performed beforehand.

**Implemented enhancements:**

- Cosmetic: change "run" icon [\#48](https://github.com/cpwood/Pico-Go/issues/48)
- Remove dependency on Node JS installation \(external to Electron\) [\#46](https://github.com/cpwood/Pico-Go/issues/46)

**Fixed bugs:**

- Pico not resetting before Run [\#49](https://github.com/cpwood/Pico-Go/issues/49)

## [v1.2.0](https://github.com/cpwood/Pico-Go/tree/v1.2.0) (2021-03-04)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/v1.1.0...v1.2.0)

A few bits of new functionality including a Pin Map and a few bug fixes, however the majority of the work that went into this release, you won't see! The codebase has been significantly refactored to make it far more maintainable and amenable to whatever fun stuff we want to do in the future!

There is one breaking change: if you have a `pymakr.conf` file in your project, rename it to `pico-go.json`. I've chosen _not_ to automate this just in case you're still using Pymakr for your non-Pico projects.

**Implemented enhancements:**

- Show Pico Pin Map via Command Palette [\#41](https://github.com/cpwood/Pico-Go/issues/41)
- Remove callback spaghetti [\#35](https://github.com/cpwood/Pico-Go/issues/35)
- Feature/async await [\#44](https://github.com/cpwood/Pico-Go/pull/44) ([cpwood](https://github.com/cpwood))

**Fixed bugs:**

- pico-go.net domain suspended [\#42](https://github.com/cpwood/Pico-Go/issues/42)
- Terminal exits repeatedly with exit code: 1 [\#28](https://github.com/cpwood/Pico-Go/issues/28)
- code formatting in Visual Studio Code \(keybinding conflict\) [\#40](https://github.com/cpwood/Pico-Go/issues/40)
- Can't configure new project: "pymakr.initialise failed" [\#38](https://github.com/cpwood/Pico-Go/issues/38)
- Only show recommended extensions if not already installed [\#37](https://github.com/cpwood/Pico-Go/issues/37)
- REPL while running [\#34](https://github.com/cpwood/Pico-Go/issues/34)
- Not resetting code in Pico? [\#32](https://github.com/cpwood/Pico-Go/issues/32)
- Uploading the current file from a nested folder fails when the equivalent folders don't exist on the Pico [\#30](https://github.com/cpwood/Pico-Go/issues/30)

## [v1.1.0](https://github.com/cpwood/Pico-Go/tree/v1.1.0) (2021-02-17)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/v1.0.8...v1.1.0)

### New Web Site

Check out the brand new [Pico-Go web site](http://pico-go.net/)!

### Linting and Autocompletion now even easier!

Linting and autocompletion can now be set up by choosing:

```
Pico-Go > Configure project
```

To see this in action, visit the [Quick Start](http://pico-go.net/docs/start/quick/#start-a-new-pico-project) guide.

Stubs for the Pico (firmware 1.14) have been included within the Pico-Go extension. Pylance is used for linting.

### Collecting support info
Additionally, it's now possible collect version information for support tickets by choosing:

```
Pico-Go > Extra > Get support info
```

This will give output similar to the following in the REPL console:

```
Pico-Go:      1.1.0
VS Code:      1.53.2
Electron:     11.2.1
Modules:      85
Node:         12.18.3
Platform:     darwin
Architecture: x64
Board:        Raspberry Pi Pico with RP2040
Firmware:     v1.14 on 2021-02-16 (GNU 10.2.0 MinSizeRel)
```

### Remote SSH Extension

Finally, I've added an alert to advise that the extension _isn't_ currently compatible with SSH Remoting.

**Implemented enhancements:**

- Provide an easier means of gathering version info for support tickets [\#26](https://github.com/cpwood/Pico-Go/issues/26)
- Include stubs within Pico-Go [\#24](https://github.com/cpwood/Pico-Go/issues/24)
- Alert the user if VSCode Remote - SSH extension in use [\#23](https://github.com/cpwood/Pico-Go/issues/23)

**Merged pull requests:**

- Use vendorId if manufacturer string is null to allow auto connect [\#29](https://github.com/cpwood/Pico-Go/pull/29) ([schilken](https://github.com/schilken))

## [v1.0.8](https://github.com/cpwood/Pico-Go/tree/v1.0.8) (2021-02-11)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/v1.0.7...v1.0.8)

This release focuses on Mac (Silicon) and Linux ARM64 support, as well as allowing a COM port or device path to be specified manually.

**Implemented enhancements:**

- Provide better guidance on incompatible platform/arch combinations [\#18](https://github.com/cpwood/Pico-Go/issues/18)
- Support Apple M1 \(ARM64\) [\#16](https://github.com/cpwood/Pico-Go/issues/16)
- Support Linux arm64 [\#15](https://github.com/cpwood/Pico-Go/issues/15)
- How to Select COM port [\#12](https://github.com/cpwood/Pico-Go/issues/12)

## [v1.0.7](https://github.com/cpwood/Pico-Go/tree/v1.0.7) (2021-02-06)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/v1.0.5...v1.0.7)

This fixes a critical compatibility issue with VS Code 1.53.0.

**Fixed bugs:**

- VSCode 1.53.0 incompatibility [\#11](https://github.com/cpwood/Pico-Go/issues/11)

## [v1.0.5](https://github.com/cpwood/Pico-Go/tree/v1.0.5) (2021-02-04)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/v1.0.4...v1.0.5)

This fixes the extension so it works with VS Code version 1.53.0. It also improves the wording of several error messages.

**Fixed bugs:**

- command 'pymakr.connect' not found [\#9](https://github.com/cpwood/Pico-Go/issues/9)
- Clarify "click here to try again" message [\#8](https://github.com/cpwood/Pico-Go/issues/8)

## [v1.0.4](https://github.com/cpwood/Pico-Go/tree/v1.0.4) (2021-01-31)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/v1.0.2...v1.0.4)

The theme of this release is largely around the documentation and issue management for the project within GitHub.

**Implemented enhancements:**

- Include Change Log [\#5](https://github.com/cpwood/Pico-Go/issues/5)
- Update bug template to include hardware details and default the labels on all issues [\#4](https://github.com/cpwood/Pico-Go/issues/4)
- Include detailed guidance on getting started within README.md [\#3](https://github.com/cpwood/Pico-Go/issues/3)

## [v1.0.2](https://github.com/cpwood/Pico-Go/tree/v1.0.2) (2021-01-29)

[Full Changelog](https://github.com/cpwood/Pico-Go/compare/ef23da56472637f70b22003ce7a9cfb1f4fa7745...v1.0.2)

**Fixed bugs:**

- User messages still refer to "PyCom" and "Pymakr" [\#2](https://github.com/cpwood/Pico-Go/issues/2)
- "No PyCom boards found on USB", but other REPL tools outside of VS Code work fine [\#1](https://github.com/cpwood/Pico-Go/issues/1)



\* *This Changelog was automatically generated by [github_changelog_generator](https://github.com/github-changelog-generator/github-changelog-generator)*

#  Pico-Go VS Code Extension 

Pico-Go provides code auto-completion and allows  you to communicate with your Raspberry Pi Pico board using the built-in REPL console. Run a single file on your board, sync your entire project or directly type and execute commands.

This software is a derivative product of [Pymakr](https://marketplace.visualstudio.com/items?itemName=pycom.Pymakr) by Pycom Ltd under the terms of its [GNU GPL Version 3+ license](LICENSE.md).

- Works with macOS, Linux, and Windows.
- Connects to the Raspberry Pi Pico board.

![Terminal](https://raw.githubusercontent.com/cpwood/Pico-Go/main/images/screenshot1.png)

To find out what's new, take a look at the [changelog](CHANGELOG.md).

## Getting Started

Have the onboard LED flashing in under 5 minutes by following the [Quick Start guide](http://pico-go.net/docs/start/quick/) over on the [Pico-Go web site](http://pico-go.net).

## Dependencies

- [NodeJS](https://nodejs.org) installed on your system (6.9.5 or higher) ; this is required **in addition** to the version of NodeJS included with Electron.

## Why Pico-Go? Why not contribute to the Pymakr project?

Pretty much 99.9% of the code in this repo is from the fantastic [Pymakr](https://github.com/pycom/pymakr-vsc) project. 

Whilst the out-of-the-box version of Pymakr can talk to a Pico board after a little initial configuration, it makes certain assumptions about the capabilities of the board. For example, when transferring files, it attempts to calculate file hashes to check the file has copied correctly. The Python module that it attempts to use for this isn't available on the Pico, so uploading or downloading fails.

There were two options available: change the existing Pymakr project so it could work with another manufacturer's board - i.e. add checks to detect whether a capability was available on the board before attempting an action - or create a derivative product.

It didn't seem right or fair to place the burden of supporting third party boards on Pycom. Plus, there were several months of outstanding Pull Requests, so it wouldn't have been swift to get any proposed changes included into the extension.

For these reasons, Pico-Go was created using the Pymakr code as a starting point.

At the time of writing, the main changes from the original Pymakr project are:

* Communication is via serial port only since there is no Wifi capability on the Pico;
* File hash checks have been removed;
* A new command has been added to the Command Palette allowing a user to delete all files and directories from their Pico board;
* Documentation has been comprehensively updated, corrected and pruned.
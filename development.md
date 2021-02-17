# Developing Pico-Go
## Setup
If you want to contribute to this project you can test the app the following way:

- Download the code or clone the repo
- Install packages using `npm install`
- Open the folder in VSC
- Ensure `.vscode/launch.json` has a `runtimeExecutable` value suitable for your machine, e.g. on a Mac `/Users/chris/source/repos/Pico-Go/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron`
- Ensure `.vscode/launch.json` has a `program` value suitable for your machine.
- From the command palette,  `Tasks: Run build task` to run the babel builder
- From the debug panel, start `Launch Extension`.

> If you receive a warning from MacOS about not being able to access `bindings.node` because it hasn't been signed by a developer, cancel the notification and then go to *System Preferences > Security & Privacy > General* and click the *Allow* button. Then try again. 

Note: make sure you have the 'code' terminal command installed. See [code setup for Mac](https://code.visualstudio.com/docs/setup/mac)

## Create a local package
- Install the vscode publishing tool by running `npm install -g vsce`
- Create a .vsix package by running `vsce package` or running the `package` NPM script.
- you can then install the .vsix package by running `code --install-extension Pico-Go-1.x.y.vsix`
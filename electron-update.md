# Updating serialport bindings for a new version of Electron

Find out the version of Electron from VSCode's *About Visual Studio Code* menu item then include it in the final command below:

```
npm update
npm rebuild
./node_modules/.bin/electron-rebuild -f -w serialport --version 11.2.1
```

> **Note:** the final command requires the ability to recompile Node modules. On a Mac, this means having XCode installed.
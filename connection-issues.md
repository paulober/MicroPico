# Debugging serial port connection issues

Most serial port issues are caused by the serial port being inaccessible.

## The Basics

Two _really_ quick checks you can make before jumping into anything more technical:

1. That it's plugged in properly with the computer-side and Pico-side both being fully pushed in all the way.
2. That another piece of software isn't already using the serial port. Remember, *only one piece of software can use your Pico at a time.* So if you're using Thonny and it's connected to the Pico, VS Code *won't* be able to connect.

## Other Quick Fixes

There are two things you can restart: your computer and the Pico.

Try the Pico first: disconnect the USB cable so it loses all power and then plug it in again.

If that fails, try a reboot of your computer.

## More Detailed Investigation

### Windows

Follow [these instructions](https://knowledge.ni.com/KnowledgeArticleDetails?id=kA03q000000YGw9CAG&l=en-GB) to diagnose which process is using the COM port assigned to your Pico.

### macOS and Linux

To establish which process is holding on to your serial port, you can try this command:

```
lsof | grep usbmodem
```

This should return something like this:

```
Code\x20- 5777 chris 39u CHR 9,6 0t266 3901 /dev/tty.usbmodem0000000000001
```

In this example, `5777` is the process ID for what's using `/dev/tty.usbmodem0000000000001`. We can then use this command to find out what that process is:

```
ps -ax | grep 5777
```

This returns output as follows:

```
5777 ?? 0:04.20 /Applications/Visual Studio Code - Insiders.app/Contents/Frameworks/Code - Insiders Helper (Renderer).app/Contents/MacOS/Code - Insiders Helper (Renderer) --inspect-port=0 /Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/out/bootstrap-fork --type=extensionHost
```

We can see from this output from a Mac that `Visual Studio Code - Insiders.app` is using the serial port. We can then try and establish whether this is another zombie instance of VS Code that's holding on to the serial port and kill the process off, if necessary.
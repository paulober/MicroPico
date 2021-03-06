# Changelog

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

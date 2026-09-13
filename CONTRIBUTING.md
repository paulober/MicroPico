# Contributing to MicroPico

Thanks for your interest in improving MicroPico! Contributions of all sizes are welcome.

## Ways to help

- **Report bugs** or **suggest features** using the [issue forms](https://github.com/paulober/MicroPico/issues/new/choose).
- **Answer questions** in [Discussions](https://github.com/paulober/MicroPico/discussions).
- **Tell us where you use MicroPico**, for example in a course, with the "We use MicroPico" issue form.
- **Send a pull request.** For larger changes, please open an issue first so we can agree on the approach.

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md). Security issues go through the [security policy](SECURITY.md), not public issues.

## Development setup

You need:

- [Node.js](https://nodejs.org/) 24.18 or newer
- [VS Code](https://code.visualstudio.com/) 1.137 or newer
- Python 3.10 or newer with pip (used to download the bundled MicroPython stubs)

The serial library `@paulober/pico-mpy-com` is published to GitHub Packages, which requires a token even for public packages:

1. Create a [personal access token (classic)](https://github.com/settings/tokens) with the `read:packages` scope.
2. Add it to your user `~/.npmrc` (not the one in the repository):

   ```ini
   //npm.pkg.github.com/:_authToken=YOUR_TOKEN
   ```

Then:

```bash
git clone https://github.com/paulober/MicroPico.git
cd MicroPico
npm ci
```

Open the folder in VS Code and press <kbd>F5</kbd> (**Run Extension**) to start a development window with MicroPico loaded.

## Checks

Run these before opening a pull request. CI runs them too.

```bash
npm run lint
npm run typecheck
npm test          # unit tests
npm run test:e2e  # end-to-end tests in a real VS Code (downloads VS Code)
```

Unit tests use `node:test` and live next to the code (`*.test.mts`). The `vscode` API and the serial library are replaced by small stubs in `src/test-support/`.

## Project layout

| Path | Contents |
| :--- | :------- |
| `src/commands/` | One class per command, sharing state through `SessionContext` |
| `src/connection/` | Board detection and auto-connect |
| `src/plotter/`, `web/plotter/` | Live plotter view and its webview |
| `src/output/` | Routing of board output to the plotter and files |
| `test/e2e/` | End-to-end tests |
| `scripts/` | Packaging, publishing and SBOM scripts |

Communication with the board (file transfer, REPL, resets) lives in [pico-mpy-com](https://github.com/paulober/pico-mpy-com); changes there need a pull request in that repository.

## Pull requests

- Branch off `main` and keep each pull request focused on one change.
- Add or update tests for behavior changes.
- Use short, imperative commit messages, e.g. `Fix upload of empty files`.
- Don't bump the version or edit `CHANGELOG.md`; that happens when a release is prepared.

## License

By contributing, you agree that your contributions are licensed under the [Apache License 2.0](LICENSE.txt), the license of this project.

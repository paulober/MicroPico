# Updating serialport bindings for a new version of Electron

Change the `electronVersion` value in `package.json` for the `Bindings-Builder` repo, commit and push. The Action will build the `bindings.node` files for each OS and will commit and push them to the `develop` branch of this repo.

Pull the changes for the `develop` branch and then run the `postinstall` script.

#!/bin/bash

# This script's purpose is to publish the VSCode extension to the VSCode Marketplace 
# and OpenVSX Registry also it packages binaries for each 
# platform to reduced vsix size

# Get the directory where publish.sh is located
SCRIPT_DIR=$(dirname "$(realpath "$BASH_SOURCE")")

# Ensure package.sh is executable
chmod +x "$SCRIPT_DIR/package.sh"

# Call the package.sh script using the absolute path
"$SCRIPT_DIR/package.sh"

# Find all .vsix files except the one without a platform prefix and publish them one by one
find . -type f -name "micropico-$RELEASE_TAG_NAME-*.vsix" ! -name "micropico-$RELEASE_TAG_NAME.vsix" | while read -r package_path; do
  # If the filename contains "darwin", skip as macOS universal publishing issn't possible at the moment
  if [[ "$package_path" == *"darwin"* ]]; then
    # delete this vsix file
    rm -rf "$package_path"
    continue
  fi

  # Publish the VSCode extension to the VSCode Marketplace
  npx @vscode/vsce publish --packagePath "$package_path"
  # Publish the VSCode extension to the Open VSX Registry
  npx ovsx publish "$package_path" -p "$OVSX_PAT"
  # delete this vsix file
  rm -rf "$package_path"
done

# macOS universal publish not possible workaround

rm -rf prebuilds
mkdir prebuilds
cp -r "node_modules/@serialport/bindings-cpp/prebuilds/darwin-x64+arm64" "./prebuilds"
npx @vscode/vsce publish --no-yarn --target darwin-x64 darwin-arm64
npx ovsx publish --target darwin-x64 darwin-arm64 -p "$OVSX_PAT"

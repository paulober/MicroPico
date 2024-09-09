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
find . -type f -name "micropico-$RELEASE_TAG_NAME-*.vsix" ! -name "micropico-$RELEASE_TAG_NAME.vsix" | while read file -r package_path; do
  # Default target flags (for non-darwin platforms)
  target_flags=""

  # If the filename contains "darwin", add the appropriate target flags
  if [[ "$package_path" == *"darwin"* ]]; then
    target_flags="--target darwin-x64 darwin-arm64 "
  fi

  # Publish the VSCode extension to the VSCode Marketplace
  npx @vscode/vsce publish $target_flags--packagePath "$package_path"
  # Publish the VSCode extension to the Open VSX Registry
  npx ovsx publish "$package_path" $target_flags-p "$OVSX_PAT"
  # delete this vsix file
  rm -rf "$package_path"
done

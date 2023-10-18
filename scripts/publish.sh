#!/bin/bash

# This script's purpose is to publish the VSCode extension to the VSCode Marketplace 
# and package binaries for each platform to reduced vsix size

# Run npm run package
npm run package

# Create a folder dist/scripts if it doesn't exist
mkdir -p dist/scripts

# Define an array of platforms
platforms=("win32" "macOS_arm64" "macOS_amd64" "linux_arm64" "linux_amd64")

# Loop through the platforms
for platform in "${platforms[@]}"; do
  # Copy the scripts to dist/scripts for each platform
  cp -r "node_modules/@paulober/pyboard-serial-com/scripts/wrapper_$platform" "dist/scripts"

  # Package the VSCode extension for the platform
  if [ "$platform" == "win32" ]; then
    npx @vscode/vsce package --no-yarn --target "win32-x64"
  elif [ "$platform" == "macOS_arm64" ]; then
    npx @vscode/vsce package --no-yarn --target "darwin-arm64"
  elif [ "$platform" == "macOS_amd64" ]; then
    npx @vscode/vsce package --no-yarn --target "darwin-x64"
  elif [ "$platform" == "linux_arm64" ]; then
    npx @vscode/vsce package --no-yarn --target "linux-arm64"
  elif [ "$platform" == "linux_amd64" ]; then
    npx @vscode/vsce package --no-yarn --target "linux-x64"
  fi

  # Remove the copied scripts for the current platform
  rm -r "dist/scripts/wrapper_$platform"
done

# Find all .vsix files and join them into a space-separated string
package_paths=$(find . -name "*.vsix" -type f -exec echo -n "{} " \;)

# Publish the packages
npx @vscode/vsce publish --packagePath "$package_paths"

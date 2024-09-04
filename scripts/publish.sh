#!/bin/bash

# This script's purpose is to publish the VSCode extension to the VSCode Marketplace 
# and OpenVSX Registry also it packages binaries for each 
# platform to reduced vsix size

# Define an array of platforms
platforms=("win32-x64" "darwin-x64+arm64" "linux-arm64" "linux-arm" "linux-x64" "universal")
rm -rf dist

# Loop through the platforms
for platform in "${platforms[@]}"; do
  rm -rf prebuilds
  mkdir prebuilds

  if [ "$platform" != "universal" ]; then
    # Copy the bindings binary for each platform
    cp -r "node_modules/@serialport/bindings-cpp/prebuilds/$platform" "./prebuilds"
  else
    # Copy the bindings binaries for all platforms
    cp -r "node_modules/@serialport/bindings-cpp/prebuilds" "./"
  fi

  # Package the VSCode extension for the platform
  if [ "$platform" == "win32-x64" ]; then
    npx @vscode/vsce package --no-yarn --target "win32-x64" -o "micropico-$RELEASE_TAG_NAME-$platform.vsix"
  elif [ "$platform" == "darwin-x64+arm64" ]; then
    npx @vscode/vsce package --no-yarn --target "darwin-arm64 darwin-x64" -o "micropico-$RELEASE_TAG_NAME-$platform.vsix"
  elif [ "$platform" == "linux-arm64" ]; then
    npx @vscode/vsce package --no-yarn --target "linux-arm64" -o "micropico-$RELEASE_TAG_NAME-$platform.vsix"
  elif [ "$platform" == "linux-arm" ]; then
    npx @vscode/vsce package --no-yarn --target "linux-armhf" -o "micropico-$RELEASE_TAG_NAME-linux-armhf.vsix"
  elif [ "$platform" == "linux-x64" ]; then
    npx @vscode/vsce package --no-yarn --target "linux-x64" -o "micropico-$RELEASE_TAG_NAME-$platform.vsix"
  else
    npx @vscode/vsce package --no-yarn -o "micropico-$RELEASE_TAG_NAME.vsix"
  fi
done

# Find all .vsix files except the one without a platform prefix and publish them one by one
find . -type f -name "micropico-$RELEASE_TAG_NAME-*.vsix" ! -name "micropico-$RELEASE_TAG_NAME.vsix" | while read file -r package_path; do
  # Publish the VSCode extension to the VSCode Marketplace
  npx @vscode/vsce publish --packagePath "$package_path"
  # Publish the VSCode extension to the Open VSX Registry
  npx ovsx publish "$package_path" -p "$OVSX_PAT"
  # delete this vsix file
  rm -rf "$package_path"
done

#!/bin/bash

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

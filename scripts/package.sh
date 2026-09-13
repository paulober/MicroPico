#!/usr/bin/env bash
# Packages one VSIX per target platform, each with only its own serialport
# prebuild, plus a universal VSIX with all prebuilds for manual installs.
set -euo pipefail

: "${RELEASE_TAG_NAME:?RELEASE_TAG_NAME must be set}"

PREBUILDS="node_modules/@serialport/bindings-cpp/prebuilds"

# vsce target:prebuild folder
targets=(
  "win32-x64:win32-x64"
  "win32-arm64:win32-arm64"
  "linux-x64:linux-x64"
  "linux-arm64:linux-arm64"
  "linux-armhf:linux-arm"
  "darwin-x64:darwin-x64+arm64"
  "darwin-arm64:darwin-x64+arm64"
)

rm -rf dist

for entry in "${targets[@]}"; do
  target="${entry%%:*}"
  prebuild="${entry#*:}"

  rm -rf prebuilds
  mkdir prebuilds
  cp -r "$PREBUILDS/$prebuild" prebuilds/

  npx @vscode/vsce package --no-yarn --target "$target" \
    -o "micropico-$RELEASE_TAG_NAME-$target.vsix"
done

rm -rf prebuilds
cp -r "$PREBUILDS" prebuilds
npx @vscode/vsce package --no-yarn -o "micropico-$RELEASE_TAG_NAME.vsix"

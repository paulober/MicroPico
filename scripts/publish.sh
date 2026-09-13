#!/usr/bin/env bash
# Publishes the platform VSIX files created by package.sh to the VS Code
# Marketplace and Open VSX. The universal VSIX only goes to the GitHub release.
set -euo pipefail

: "${RELEASE_TAG_NAME:?RELEASE_TAG_NAME must be set}"
: "${VSCE_PAT:?VSCE_PAT must be set}"
: "${OVSX_PAT:?OVSX_PAT must be set}"

shopt -s nullglob
packages=("micropico-$RELEASE_TAG_NAME"-*.vsix)

if [ ${#packages[@]} -eq 0 ]; then
  echo "No platform packages found. Run scripts/package.sh first." >&2
  exit 1
fi

for package in "${packages[@]}"; do
  echo "Publishing $package"
  # --skip-duplicate makes a failed run safe to re-run
  npx @vscode/vsce publish --skip-duplicate --packagePath "$package"
  npx ovsx publish --skip-duplicate -p "$OVSX_PAT" "$package"
done

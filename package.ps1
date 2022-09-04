# clear dist
Remove-Item -R dist/*
# rebuild dist with webpack done in vsce prepackage script
npx vsce package --yarn

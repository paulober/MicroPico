# clear dist
rm -R dist/*
# rebuild dist with webpack
pnpm run compile
npx vsce package

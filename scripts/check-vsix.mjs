import { execSync } from "node:child_process";

// Guards against packaging leakage into the VSIX (e.g. a stray local
// dependency checkout or a node_modules tree). Runs `vsce ls` and fails if any
// shipped path looks like an accidental inclusion.

const output = execSync("npx --yes @vscode/vsce ls", { encoding: "utf8" });
const files = output
  .split("\n")
  .map(line => line.trim())
  .filter(Boolean);

const forbidden = files.filter(
  file =>
    /(^|\/)node_modules\//.test(file) ||
    /^pico-mpy-com\//.test(file) ||
    /(^|\/)test-out\//.test(file) ||
    /\.test\.[cm]?[jt]s$/.test(file)
);

if (forbidden.length > 0) {
  console.error(
    `VSIX guard failed: ${forbidden.length} file(s) that must not ship:`
  );
  console.error(forbidden.slice(0, 10).join("\n"));
  process.exit(1);
}

console.log(
  `VSIX guard OK: ${files.length} files, no node_modules/local-dep leakage.`
);

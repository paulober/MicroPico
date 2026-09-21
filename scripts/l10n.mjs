// Keeps the translations in sync.
//
//   node scripts/l10n.mjs export   collects every l10n.t() string in src/ into
//                                  l10n/bundle.l10n.json (the English source)
//   node scripts/l10n.mjs check    fails when that file is out of date or a
//                                  translation misses, adds or breaks a string
//
// @vscode/l10n-dev can't read .mts files, so the strings are collected with
// the TypeScript compiler instead.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const root = join(import.meta.dirname, "..");
const bundlePath = join(root, "l10n", "bundle.l10n.json");

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "test-support" ? [] : sourceFiles(path);
    }

    return /\.m?ts$/.test(entry.name) && !/\.test\.m?ts$/.test(entry.name)
      ? [path]
      : [];
  });
}

function extract() {
  const strings = {};
  const errors = [];

  for (const file of sourceFiles(join(root, "src"))) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true
    );

    const visit = node => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "t" &&
        node.expression.expression.getText(source) === "l10n"
      ) {
        const arg = node.arguments[0];
        if (arg && ts.isStringLiteralLike(arg)) {
          strings[arg.text] = arg.text;
        } else {
          const { line } = source.getLineAndCharacterOfPosition(node.pos);
          errors.push(
            `${file}:${line + 1}: l10n.t() needs a string literal as its first argument`
          );
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }

  return { strings, errors };
}

function serialize(strings) {
  const sorted = Object.fromEntries(
    Object.keys(strings)
      .sort()
      .map(key => [key, strings[key]])
  );

  return JSON.stringify(sorted, null, 2) + "\n";
}

const placeholders = text => (text.match(/\{\d+\}/g) ?? []).sort().join(",");

// compares one translation with its English source file
function compare(base, translated, name) {
  const problems = [];
  for (const key of Object.keys(base)) {
    if (!(key in translated)) {
      problems.push(`${name}: missing "${key}"`);
    } else if (placeholders(base[key]) !== placeholders(translated[key])) {
      problems.push(`${name}: placeholders differ in "${key}"`);
    }
  }
  for (const key of Object.keys(translated)) {
    if (!(key in base)) {
      problems.push(`${name}: unused "${key}"`);
    }
  }

  return problems;
}

function translations(dir, prefix) {
  return readdirSync(dir)
    .filter(name => name.startsWith(prefix) && name !== `${prefix}json`)
    .map(name => ({
      name,
      content: JSON.parse(readFileSync(join(dir, name), "utf8")),
    }));
}

const mode = process.argv[2];
const { strings, errors } = extract();

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

if (mode === "export") {
  writeFileSync(bundlePath, serialize(strings));
  console.log(`Wrote ${Object.keys(strings).length} strings to l10n/bundle.l10n.json`);
} else if (mode === "check") {
  const problems = [];

  if (readFileSync(bundlePath, "utf8") !== serialize(strings)) {
    problems.push(
      "l10n/bundle.l10n.json is out of date, run: node scripts/l10n.mjs export"
    );
  }

  for (const { name, content } of translations(join(root, "l10n"), "bundle.l10n.")) {
    problems.push(...compare(strings, content, name));
  }

  const nls = JSON.parse(readFileSync(join(root, "package.nls.json"), "utf8"));
  const missingNls = [
    ...readFileSync(join(root, "package.json"), "utf8").matchAll(/"%([^%"]+)%"/g),
  ]
    .map(match => match[1])
    .filter(key => !(key in nls));
  problems.push(...missingNls.map(key => `package.nls.json: missing "${key}"`));

  for (const { name, content } of translations(root, "package.nls.")) {
    problems.push(...compare(nls, content, name));
  }

  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log("Translations are complete.");
} else {
  console.error("Usage: node scripts/l10n.mjs export|check");
  process.exit(1);
}

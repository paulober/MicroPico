// Module resolution hook that maps the bare `vscode` specifier to the test
// stub, so extension modules can be imported and unit tested with node:test
// outside the VS Code Extension Host.
import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

function stub(relativePath) {
  return pathToFileURL(resolvePath(process.cwd(), relativePath)).href;
}

// Bare specifiers that are provided by the VS Code host or ship as
// bundler-only packages, mapped to lightweight test doubles.
const stubs = {
  vscode: stub("test-out/test-support/vscodeStub.mjs"),
  "@paulober/pico-mpy-com": stub("test-out/test-support/picoMpyComStub.mjs"),
};

export function resolve(specifier, context, nextResolve) {
  const url = stubs[specifier];
  if (url) {
    return { url, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}

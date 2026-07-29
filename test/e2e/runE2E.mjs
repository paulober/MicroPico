// Downloads a real VS Code, pre-installs the required ms-python.python
// dependency, then launches the Extension Host to run the E2E smoke suite.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  runTests,
  downloadAndUnzipVSCode,
  resolveCliArgsFromVSCodeExecutablePath,
} from "@vscode/test-electron";

const here = path.dirname(fileURLToPath(import.meta.url));
const extensionDevelopmentPath = path.resolve(here, "..", "..");
const extensionTestsPath = path.resolve(here, "suite", "index.cjs");
const workspace = path.resolve(here, "fixtures", "project");

async function main() {
  const vscodeExecutablePath = await downloadAndUnzipVSCode("stable");

  // MicroPico declares ms-python.python as an extensionDependency, so VS Code
  // will not activate it unless the Python extension is installed first.
  const [cli, ...cliArgs] =
    resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
  const install = spawnSync(
    cli,
    [...cliArgs, "--install-extension", "ms-python.python"],
    { encoding: "utf-8", stdio: "inherit" }
  );
  if (install.status !== 0) {
    throw new Error("failed to install ms-python.python into the test VS Code");
  }

  await runTests({
    vscodeExecutablePath,
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: [
      workspace,
      "--disable-workspace-trust",
      // keep the profile clean and deterministic across runs
      "--skip-welcome",
      "--skip-release-notes",
    ],
  });
}

main().catch(err => {
  console.error("E2E run failed:", err);
  process.exit(1);
});

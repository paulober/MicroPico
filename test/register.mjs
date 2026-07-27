// Registers the vscode resolution hook before the test files are imported.
import { register } from "node:module";

register("./vscode-loader.mjs", import.meta.url);

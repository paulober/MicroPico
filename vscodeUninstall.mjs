/* eslint-disable */
import { homedir } from "os";
import { join } from "path";
import { rimraf } from "rimraf";

function getVsCodeUserPath() {
  const homeDir = homedir();

  let folder;

  switch (process.platform) {
    case "win32":
      folder = process.env.APPDATA || join(homeDir, "AppData", "Roaming");
      break;
    case "darwin":
      folder = join(homeDir, "Library", "Application Support");
      break;
    case "linux":
      folder = join(homeDir, ".config");
      break;
    default:
      folder = "/var/local";
  }

  return join(folder, "Code", "User");
}

const stubsFolder = join(getVsCodeUserPath(), "Pico-W-Stub");
const newStubsFolder = join(homedir(), ".micropico-stubs")

const result = await rimraf(stubsFolder, { glob: false });
console.log("Pico-W-Stub uninstall result: ", result ? "success" : "failure");

const result2 = await rimraf(newStubsFolder, { glob: false });
console.log("New stubs uninstall result: ", result2 ? "success" : "failure");

/* eslint-enable */

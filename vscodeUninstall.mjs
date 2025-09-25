/* eslint-disable */
import { homedir } from "os";
import { join } from "path";
import { rm } from "fs/promises";

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

await rm(stubsFolder, { recursive: true, force: true });
console.log("Pico-W-Go stubs uninstall result: success");

await rm(newStubsFolder, { recursive: true, force: true });
console.log("MicroPico stubs uninstall result: success");

/* eslint-enable */

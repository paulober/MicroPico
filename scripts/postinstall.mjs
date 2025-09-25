#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";

const PKG = "micropython-rp2-rpi_pico2_w-stubs==1.26.*";
const TARGET = "./mpy_stubs";

if (!existsSync(TARGET)) mkdirSync(TARGET, { recursive: true });

const candidates = [];
if (process.env.PYTHON) candidates.push(process.env.PYTHON);
if (process.platform === "win32") {
    candidates.push("py -3", "py", "python", "python3");
} else {
    candidates.push("python3", "python");
}

function findPython() {
    for (const c of candidates) {
        const [exe, ...pre] = c.split(" ");
        // has pip?
        let r = spawnSync(exe, [...pre, "-m", "pip", "--version"], { encoding: "utf8" });
        if (r.status !== 0) continue;
        // is Python 3?
        r = spawnSync(exe, [...pre, "-c", "import sys; print(sys.version_info.major)"], { encoding: "utf8" });
        if (r.status !== 0 || String(r.stdout).trim() !== "3") continue;
        return { exe, pre };
    }
    return null;
}

const py = findPython();
if (!py) {
    console.warn("[postinstall] No usable Python 3 with pip found. Tried:", candidates.join(", "));
    console.warn('Install Python 3 and ensure it is on PATH (Windows: the "py" launcher is recommended).');
    process.exit(0); // change to 1 if you want to fail the install
}

const args = [...py.pre, "-m", "pip", "install", "-U", PKG, "--target", TARGET, "--no-user"];
const run = spawnSync(py.exe, args, { stdio: "inherit" });
if (run.status !== 0) {
    console.error("[postinstall] pip install failed.");
    process.exit(run.status ?? 1);
}

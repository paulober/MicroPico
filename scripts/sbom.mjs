// Prints a CycloneDX SBOM for the extension package: the bundled npm
// dependencies from `npm sbom`, plus the parts npm doesn't know about
// (the vendored uPlot build and the MicroPython stubs installed by pip).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const sbom = JSON.parse(
  execFileSync(
    "npm",
    ["sbom", "--omit", "dev", "--sbom-format", "cyclonedx"],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  ),
);

function library(name, version, license, purl, website) {
  return {
    type: "library",
    "bom-ref": purl,
    name,
    version,
    licenses: [{ license: { id: license } }],
    purl,
    externalReferences: [{ type: "website", url: website }],
  };
}

const extra = [];

const uplot = JSON.parse(
  readFileSync("node_modules/uplot/package.json", "utf8"),
);
extra.push(
  library(
    "uplot",
    uplot.version,
    "MIT",
    `pkg:npm/uplot@${uplot.version}`,
    "https://github.com/leeoniya/uPlot",
  ),
);

// e.g. micropython_rp2_rpi_pico2_w_stubs-1.26.0.post1.dist-info
if (existsSync("mpy_stubs")) {
  for (const entry of readdirSync("mpy_stubs")) {
    const match = /^(.+)-([^-]+)\.dist-info$/.exec(entry);
    if (!match) {
      continue;
    }
    const [, name, version] = match;
    const pypiName = name.toLowerCase().replaceAll("_", "-");
    extra.push(
      library(
        pypiName,
        version,
        "MIT",
        `pkg:pypi/${pypiName}@${version}`,
        "https://github.com/Josverl/micropython-stubs",
      ),
    );
  }
}

sbom.components = [...(sbom.components ?? []), ...extra];

const rootRef = sbom.metadata?.component?.["bom-ref"];
const root = sbom.dependencies?.find(dep => dep.ref === rootRef);
if (root) {
  root.dependsOn = [
    ...(root.dependsOn ?? []),
    ...extra.map(c => c["bom-ref"]),
  ];
}

process.stdout.write(JSON.stringify(sbom, null, 2) + "\n");

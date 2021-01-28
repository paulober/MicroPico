const core = require("@actions/core");
const github = require("@actions/github");
const atob = require("atob");

const gitToken = core.getInput("git-token") || process.env.GITHUB_TOKEN;
const octokit = new github.GitHub(gitToken);

const repo = {
  owner: "microsoft",
  repo: "vscode"
};

/**
 * Resolves Electron runtime target for given
 * VSCode git tag
 *
 * @param {string} tag - VSCode Git Tag
 * @returns {*} Object with tag and runtime_version
 */
const resolveElectronVersion = async tag => {
  // Fetch .yarnrc file (contains electron target)
  const response = await octokit.repos.getContents({
    ...repo,
    path: ".yarnrc",
    ref: tag
  });
  // Parse from file
  let content = atob(response.data.content).split("\n");
  let version = content[1].split("target ")[1];
  version = version.substring(1, version.length - 1);
  core.info(`Found electron tag: ${version}`);
  return {
    tag: tag,
    runtime_version: version
  };
};

/**
 * Fetches VSCode Git Tags
 * from repo
 *
 * @param {number} count - maximum number of versions to return
 * @returns {string[]} Array containing master and 3 of the latest tags
 */
const getVSCodeTags = async (count = 3) => {
  console.log("Fetching tags...");
  const repo_tags = await octokit.repos.listTags({
    ...repo,
    per_page: 50
  });

  const versReg = /^([0-9]|[1-9][0-9]*)\.([0-9]|[1-9][0-9]*)\.([0-9]|[1-9][0-9]*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/gm;

  // Filter valid tags
  let valid_tags = repo_tags.data.filter(i => {
    let vers = i.name;
    if (vers.includes("vsda") || vers.includes("translation")) {
      return false;
    }
    if (versReg.test(vers)) {
      return vers;
    }
  });
  // Take 'count' most recent versions
  valid_tags = Array.from(valid_tags.slice(0, count - 1), i => i.name);
  core.debug(`Valid tags: ${valid_tags}`);

  // Prepend master tag
  const tags = ["master", ...valid_tags];
  return tags;
};

const run = async () => {
  try {
    // Fetch git tags from VSCode Repo
    const numVersions = core.getInput("max-count") || 3;
    const tags = await getVSCodeTags(numVersions);
    core.info(`Found VSCode Tags: ${tags}`);
    // Resolve Electron Versions
    const results = await Promise.all(tags.map(i => resolveElectronVersion(i)));
    versions = Array.from(results, r => r.runtime_version).toString();
    core.info(`Electron Versions: ${versions}`);
    core.setOutput("versions", versions);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();

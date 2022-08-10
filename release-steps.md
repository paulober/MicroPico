# Releasing the Extension - Step-By-Step

## Build the VS Code Extension

- Update `package.json` with the new version number.
- Create a vsix file using the commandline: `vsce package`.

## CHANGELOG.md

### Preqrequisites

Firstly, make sure you have github-changelog-generator is installed, if it isn't already:

```
gem install github_changelog_generator
```

### GitHub Housekeeping

> Updating *CHANGELOG.md* should be the last step prior to making a release.

Ensure that:

* all commits that fix issues are pushed;
* all issues that *should* be closed *are* closed;
* any issues which aren't software changes are marked with `question` or `wontfix`;
* all issues are associated with a milestone named `vX.Y.Z`.

Create a new issue using a new template with a title of `vX.Y.Z Release` and write some preamble notes in the description. Ensure that the issue has a label of `release-summary` and is also associated with milestone `vX.Y.Z`. **Close the issue**.

### Generate the Change Log

Issue the command:

```
github_changelog_generator -u cpwood -p Pico-Go --future-release vX.Y.Z
```

## Commit and Push the Code

Do this in the usual way. The commit message should be `vX.Y.Z changelog`.

## Create a Release in GitHub

[Create a new Release](https://github.com/paulober/Pico-W-Go/releases/new) named vX.Y.Z.

Make the description of the release:

```
See the [changelog](/CHANGELOG.md).
```

## Upload the New Version of the Extension

- Go to the [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage/publishers/paulober) and log in.
- Update the package by uploading the vsix file.

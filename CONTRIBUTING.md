# Contributing

## Install and setup

### - NPM setup
In order to install `paulober/pyboard-serial-com` sub-package you first have configure npm. See ["Configuring npm for use with GitHub Package Registry."](https://help.github.com/en/articles/configuring-npm-for-use-with-github-package-registry#authenticating-to-github-package-registry)

### - Project setup
- Fork the repository into your private account
- Create a branch based on the `develop` branch with following naming scheeme `fix-<issue-id>-<short-title-of-the-issue>`
- Download your fork of the repository (Github.cli recommended)
- `cd MicroPico`
- Switch to your newly created branch (`git checkout <branch-name>` for example)
- `npm install`

Do changes and commits...

After the fix is complete do some extensive testing if all what could be affected works without problems.

- Now squash all your commits and name the final commit something like `Fix #<issue-id>, <Short title of the issue>`
    - The description of the squash commit should contain a list (description) of all the changes you've made

- Push and create a pull request to the develop branch of paulober/MicroPico

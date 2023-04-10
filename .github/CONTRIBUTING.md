# Contributing

When contributing to this repository, please first discuss the change you wish to make via an issue with the owners of this repository before making a change.

::Please note we have a Code of Conduct, please follow it in all your interactions with the project.::

## Pull Request Process

### - NPM setup
In order to install `paulober/pyboard-serial-com` sub-package you first have configure npm. See ["Configuring npm for use with GitHub Package Registry."](https://help.github.com/en/articles/configuring-npm-for-use-with-github-package-registry#authenticating-to-github-package-registry)

### Repository setup
1. Fork the repository into your private account
2. Create a branch with following naming scheeme `fix-<issue-id>-<short-title-of-the-issue>`
3. Download your fork of the repository (Github.cli recommended)
4. `cd Pico-W-Go`
5. Switch to your newly created branch (`git checkout <branch-name>` for example)
6. `npm install`

Do changes and commits...

After the fix is complete DO some extensive testing if all what could be affected works without problems.

7. Now squash all your commits and name the final commit something like `Fix #<issue-id>, <Short title of the issue>`
    - The description of the squash commit should contain a list (description) of all the changes you've made

8. Push and create a pull request to the develop branch of paulober/Pico-W-Go

## Code of Conduct

### Our Pledge

In the interest of fostering an open and welcoming environment, we as contributors and maintainers pledge to making participation in our project and our community a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behaviour that contributes to creating a positive environment include:

* Using welcoming and inclusive language
* Being respectful of differing viewpoints and experiences
* Gracefully accepting constructive criticism
* Focusing on what is best for the community
* Showing empathy towards other community members

Examples of unacceptable behaviour by participants include:

* The use of sexualised language or imagery and unwelcome sexual attention or advances
* Trolling, insulting/derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information, such as a physical or electronic address, without explicit permission
* Other conduct which could reasonably be considered inappropriate in a professional setting

### Our Responsibilities

Project maintainers are responsible for clarifying the standards of acceptable behaviour and are expected to take appropriate and fair corrective action in response to any instances of unacceptable behaviour.

Project maintainers have the right and responsibility to remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions that are not aligned to this Code of Conduct, or to ban temporarily or permanently any contributor for other behaviours that they deem inappropriate, threatening, offensive, or harmful.

### Scope

This Code of Conduct applies both within project spaces and in public spaces when an individual is representing the project or its community. Examples of representing a project or community include using an official project e-mail address, posting via an official social media account, or acting as an appointed representative at an online or offline event. Representation of a project may be further defined and clarified by project maintainers.

### Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage], version 1.4, available at [http://contributor-covenant.org/version/1/4][version]

[homepage]: http://contributor-covenant.org
[version]: http://contributor-covenant.org/version/1/4

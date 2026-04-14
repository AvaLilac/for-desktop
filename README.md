<div align="center">
<h1>
 Avia Client for Desktop
"stoat desktop"
</h1>
 <img width="256" height="256" alt="aurora" src="https://github.com/user-attachments/assets/dc3adfa3-ce3b-41ef-bdfd-9ca66d333e24" /><br />
Application for Windows, macOS, and Linux. now with avia client injected
</div>
<br/>

## Installation

<a href="https://repology.org/project/stoat-desktop/versions">
    <img src="https://repology.org/badge/vertical-allrepos/stoat-desktop.svg" alt="Packaging status" align="right">
</a>

- If you use the Browser you can find FireFox/Userscript Builds at [AviaClient Home](https://avalilac.codeberg.page/Avia-Client-Home/).
- Our Chrome Extension is Discontinued. Because Userscript offers features chrome blocks via extension

## Development Guide

_Contribution guidelines for Desktop app TBA!_

<!-- Before contributing, make yourself familiar with [our contribution guidelines](https://developers.revolt.chat/contrib.html), the [code style guidelines](./GUIDELINES.md), and the [technical documentation for this project](https://revoltchat.github.io/frontend/). -->

Before getting started, you'll want to install:

- Git
- Node.js
- pnpm (run `corepack enable`)

Then proceed to setup:

```bash
# clone the repository
git clone --recursive https://github.com/AvaLilac/for-desktop aviaclient-for-desktop

# clone the repository (If you are building from developer branch. Which is not always stable)
git clone -b dev --recursive https://github.com/AvaLilac/for-desktop aviaclient-for-desktop

# CD into the directory
cd aviaclient-for-desktop

# install all packages
pnpm i --frozen-lockfile

# update the assets. if you are using stoat's
git -c submodule."assets".update=checkout submodule update --init assets

# build the bundle
pnpm package
```

Various useful commands for development testing:

```bash
# connect to the development server
pnpm start -- --force-server http://localhost:5173

# test the flatpak (after `make`)
pnpm install:flatpak
pnpm run:flatpak
# ... also connect to dev server like so:
pnpm run:flatpak --force-server http://localhost:5173

# Nix-specific instructions for testing
pnpm package
pnpm run:nix
# ... as before:
pnpm run:nix --force-server=http://localhost:5173
# a better solution would be telling
# Electron Forge where system Electron is
```

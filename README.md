<div align="center">
<h1>
 Nylo Client for Desktop
"stoat desktop"
</h1>
 <img width="256" height="256" alt="aurora" src="https://github.com/user-attachments/assets/dc3adfa3-ce3b-41ef-bdfd-9ca66d333e24" /><br />
Application for Windows, macOS, and Linux.
</div>
<br/>

> [!NOTE]
> Nylo Client is not officially supported by ```Stoat chat```, also known as the ```Revolt Platforms Ltd```. team, Or the ```AviaClient``` team

> [!WARNING]
> My Fork Of AviaClient isnt developed yet as i dont have enough motivation. But i have ideas that will i think make it look better. Building NyloClient from source will only give you AviaClient, And no. I do not have a server yet

> [!NOTE]
> Some changes i would like to make is the following
> 1. I want to lock down the plugins manager to activate User Scripts via a toggle and only allow Trusted Plugins when the toggle is disabled
> 2. If not. Then i would atleast like to pop up a warning when adding plugins saying it can be unsafe to load from an untrusted Source
> This isnt all my ideas but its all i can think about right now. Once i figure everything out. if i get motivation. i'll do it

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
git clone --recursive https://github.com/NyloClient/for-desktop nyloclient-for-desktop

# clone the repository (If you are building from developer branch. Which is not always stable)
git clone -b dev --recursive https://github.com/NyloClient/for-desktop nyloclient-for-desktop

# CD into the directory
cd nyloclient-for-desktop

# install all packages
pnpm i --frozen-lockfile

# update the assets. if you are using stoat's
git -c submodule."assets".update=checkout submodule update --init assets

# build the bundle
pnpm package
```

For Codeberg users (Nylo does not have a mirror. but now that this is here i'll figure out how to do that with my selfhost forgejo)

```bash
Hey! We also have a codeberg mirror. If you are currently on that mirror.
here are the cloning steps for codeberg

# clone the repository
git clone --recursive https://codeberg.org/AvaLilac/for-desktop aviaclient-for-desktop

# clone the repository (If you are building from developer branch. Which is not always stable)
git clone -b dev --recursive https://codeberg.org/AvaLilac/for-desktop aviaclient-for-desktop

Then proceed to the rest of the steps above
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

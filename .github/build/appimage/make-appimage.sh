#!/bin/sh

set -eu

ARCH=$(uname -m)
export ARCH
export OUTPATH=./dist
export ADD_HOOKS="self-updater.hook"
export UPINFO="gh-releases-zsync|${GITHUB_REPOSITORY%/*}|${GITHUB_REPOSITORY#*/}|latest|*$ARCH.AppImage.zsync"

cp -v ./assets/desktop/icon.svg ./AppDir/.DirIcon
cp -v ./assets/desktop/icon.svg ./AppDir/
cp -v ./chat.stoat.StoatDesktop.desktop ./AppDir/

# Deploy dependencies
quick-sharun ./AppDir/bin/*

# Turn AppDir into AppImage
quick-sharun --make-appimage

# Test the app for 12 seconds, if the test fails due to the app
# having issues running in the CI use --simple-test instead
quick-sharun --test ./dist/*.AppImage
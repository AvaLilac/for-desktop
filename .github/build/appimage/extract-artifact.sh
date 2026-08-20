#!/bin/sh

set -eu

echo "Extracting Artifact..."
echo "---------------------------------------------------------------"

mkdir -p ./AppDir/bin
tar -xvzf /tmp/stoat/Stoat.tar.gz -C ./AppDir/bin

echo "Packaging as version $BUILD_VERSION"
echo "$BUILD_VERSION" > ~/version
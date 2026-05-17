set -e
echo "This script depends on wget, flatpak-builder, pnpm,zip and of course, flatpak. If commands don't get found, please check your installs."
cd ..
echo 'Compiling Avia...'
pnpm i --frozen-lockfile
git -c submodule."assets".update=checkout submodule update --init assets
pnpm package
echo 'Zipping up Avia build...'
cd out
zip -r AviaClient-linux-x64.zip AviaClient-linux-x64
echo "Copying necessary files to the flatpak's project folder..."
cp -v AviaClient-linux-x64.zip ../flatpak-avia/
cd ..
cp -v chat.avia.AviaClient.desktop ./flatpak-avia/
cp -v ./avia_assets/icon.png ./flatpak-avia/
echo "Building flatpak..."
cd ./flatpak-avia/ || echo "Something went wrong. flatpak-avia folder does not exist, exiting..."
flatpak-builder build --repo=flatpak_avia --user --install-deps-from=flathub --force-clean --ccache --install chat.avia.AviaClient.yml
echo "Bundling flatpak..."
flatpak build-bundle flatpak_avia aviaclient.flatpak chat.avia.AviaClient
echo "Cleaning up..."
rm -r ../out/AviaClient-linux-x64/
rm -r ../out/AviaClient-linux-x64.zip
rm -r flatpak_avia
rm -r .flatpak-builder
rm -r build
rm chat.avia.AviaClient.desktop
rm AviaClient-linux-x64.zip
rm icon.png
echo "Completed ! Please do not publish this flatpak on flathub under the Avia Client branding."

import { MakerAppX } from "@electron-forge/maker-appx";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerFlatpak } from "@electron-forge/maker-flatpak";
import { MakerFlatpakOptionsConfig } from "@electron-forge/maker-flatpak/dist/Config";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { PublisherGithub } from "@electron-forge/publisher-github";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

const STRINGS = {
  author: "Revolt Platforms LTD",
  name: "Stoat",
  execName: "stoat-desktop",
  description: "Open source user-first chat platform.",
};

const ASSET_DIR = "assets/desktop";

const makers: ForgeConfig["makers"] = [
  new MakerSquirrel({
    name: STRINGS.name,
    authors: STRINGS.author,
    iconUrl: `https://stoat.chat/app/assets/icon-DUSNE-Pb.ico`,
    setupIcon: `${ASSET_DIR}/icon.ico`,
    description: STRINGS.description,
    exe: `${STRINGS.execName}.exe`,
    setupExe: `${STRINGS.execName}-setup.exe`,
    copyright: "Copyright (C) 2025 Revolt Platforms LTD",
  }),
  new MakerZIP({}),
];

if (!process.env.PLATFORM) {
  makers.push(
    new MakerAppX({
      certPass: "",
      packageExecutable: `app\\${STRINGS.execName}.exe`,
      publisher: "CN=B040CC7E-0016-4AF5-957F-F8977A6CFA3B",
    }),
    new MakerFlatpak({
      options: {
        id: "chat.stoat.stoat-desktop",
        description: STRINGS.description,
        productName: STRINGS.name,
        productDescription: STRINGS.description,
        runtimeVersion: "25.08",
        icon: {
          "16x16": `${ASSET_DIR}/hicolor/16x16.png`,
          "32x32": `${ASSET_DIR}/hicolor/32x32.png`,
          "64x64": `${ASSET_DIR}/hicolor/64x64.png`,
          "128x128": `${ASSET_DIR}/hicolor/128x128.png`,
          "256x256": `${ASSET_DIR}/hicolor/256x256.png`,
          "512x512": `${ASSET_DIR}/hicolor/512x512.png`,
        } as unknown,
        categories: ["Network"],
        modules: [
          {
            name: "zypak",
            sources: [
              {
                type: "git",
                url: "https://github.com/refi64/zypak",
                tag: "v2025.09",
              },
            ],
          },
        ],
        finishArgs: [
          "--socket=fallback-x11",
          "--share=ipc",
          "--device=dri",
          "--socket=pulseaudio",
          "--filesystem=home",
          "--env=TMPDIR=/var/tmp",
          "--share=network",
          "--talk-name=org.freedesktop.Notifications",
          "--talk-name=com.canonical.Unity",
        ],
        files: [],
      } as MakerFlatpakOptionsConfig,
    }),
    new MakerDeb({
      options: {
        productName: STRINGS.name,
        productDescription: STRINGS.description,
        categories: ["Network"],
        icon: `${ASSET_DIR}/icon.png`,
      },
    }),
  );
}

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: STRINGS.name,
    executableName: STRINGS.execName,
    icon: `${ASSET_DIR}/icon`,
  },
  rebuildConfig: {},
  makers,
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
        {
          entry: "src/inject.js",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/aviafavsystem.js",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/pluginsupport.js",
          config: "vite.main.config.ts",
          target: "main",
        },
      ],
      renderer: [],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: "stoatchat",
        name: "for-desktop",
      },
    }),
  ],
};

export default config;

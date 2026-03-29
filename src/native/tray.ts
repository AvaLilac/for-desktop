import { Menu, Tray, nativeImage, app } from "electron";

import trayIconAsset from "../../avia_assets/icon.png?asset";
import macOsTrayIconAsset from "../../avia_assets/iconTemplate.png?asset";
import { version } from "../../package.json";
import { config } from "./config";

import { mainWindow, quitApp } from "./window";

// internal tray state
let tray: Tray = null;

// Create and resize tray icon for macOS
function createTrayIcon() {
  if (process.platform === "darwin") {
    const image = nativeImage.createFromDataURL(macOsTrayIconAsset);
    const resized = image.resize({ width: 20, height: 20 });
    resized.setTemplateImage(true);
    return resized;
  } else {
    return nativeImage.createFromDataURL(trayIconAsset);
  }
}

export function initTray() {
  const trayIcon = createTrayIcon();
  tray = new Tray(trayIcon);
  updateTrayMenu();
  tray.setToolTip("AviaClient for Desktop");
  tray.setImage(trayIcon);
  tray.on("click", () => {
    config.sync();
    if (config.disableTrayClick) { return; }
    if (mainWindow.isVisible()) {
     mainWindow.hide();
    } else {
     mainWindow.show();
     mainWindow.focus();
    }
  });
}

export function updateTrayMenu() {
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "AviaClient for Desktop", type: "normal", enabled: false },
      {
        label: "Version",
        type: "submenu",
        submenu: Menu.buildFromTemplate([
          {
            label: version,
            type: "normal",
            enabled: false,
          },
        ]),
      },
      { type: "separator" },
      {
        label: mainWindow.isVisible() ? "Hide App" : "Show App",
        type: "normal",
        click() {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
          }
        },
      },
      { type: "separator" },
      {
        label: "Restart App",
        type: "normal",
        click() {
          app.relaunch();
          app.quit();
        },
      },
      {
        label: "Quit App",
        type: "normal",
        click: quitApp,
      },
    ]),
  );
}

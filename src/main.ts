import { IUpdateInfo, updateElectronApp } from "update-electron-app";

import { BrowserWindow, Notification, app, shell } from "electron";
import started from "electron-squirrel-startup";

import { autoLaunch } from "./native/autoLaunch";
import { config } from "./native/config";
import { initDiscordRpc } from "./native/discordRpc";
import { initTray } from "./native/tray";
import { BUILD_URL, createMainWindow, mainWindow } from "./native/window";

import * as fs from "fs";
import * as path from "path";

if (started) {
  app.quit();
}

if (!config.hardwareAcceleration) {
  app.disableHardwareAcceleration();
}

const acquiredLock = app.requestSingleInstanceLock();

const onNotifyUser = (_info: IUpdateInfo) => {
  const notification = new Notification({
    title: "Update Available",
    body: "Restart the app to install the update.",
    silent: true,
  });

  notification.show();
};

const loadInject = () => {
  if (!mainWindow) return;
  mainWindow.webContents.on("dom-ready", async () => {
    try {
      const injectPath = path.join(__dirname, "inject.js");
      const injectCode = fs.readFileSync(injectPath, "utf8");
      await mainWindow.webContents.executeJavaScript(injectCode, true);
      const favPath = path.join(__dirname, "aviafavsystem.js");
      const favCode = fs.readFileSync(favPath, "utf8");
      await mainWindow.webContents.executeJavaScript(favCode, true);
    } catch {}
  });
};

if (acquiredLock) {
  updateElectronApp({ onNotifyUser });

  app.on("ready", () => {
    createMainWindow();
    loadInject();

    if (config.firstLaunch) {
      if (process.platform === "win32" || process.platform === "darwin") {
        autoLaunch.enable();
      }
      config.firstLaunch = false;
    }

    initTray();
    initDiscordRpc();

    if (process.platform === "win32") {
      app.setAppUserModelId("chat.stoat.notifications");
    }
  });

  app.on("second-instance", () => {
    mainWindow.show();
    mainWindow.restore();
    mainWindow.focus();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      loadInject();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on("web-contents-created", (_, contents) => {
    contents.on("will-navigate", (event, navigationUrl) => {
      if (new URL(navigationUrl).origin !== BUILD_URL.origin) {
        event.preventDefault();
      }
    });

    contents.setWindowOpenHandler(({ url }) => {
      if (
        url.startsWith("http:") ||
        url.startsWith("https:") ||
        url.startsWith("mailto:")
      ) {
        setImmediate(() => {
          shell.openExternal(url);
        });
      }

      return { action: "deny" };
    });
  });
} else {
  app.quit();
}

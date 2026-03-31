import * as fs from "fs";
import * as path from "path";
import { updateElectronApp } from "update-electron-app";

import { BrowserWindow, Notification, app, shell } from "electron";
import started from "electron-squirrel-startup";

import { autoLaunch } from "./native/autoLaunch";
import { config } from "./native/config";
import { initDiscordRpc } from "./native/discordRpc";
import { initTray } from "./native/tray";
import { BUILD_URL, createMainWindow, mainWindow } from "./native/window";

const applyAppName = () => {
  try {
    app.setName("AviaClient");
    app.name = "AviaClient";
    if (process.platform === "win32") {
      app.setAppUserModelId("AviaClient");
    }
  } catch {
    /* empty */
  }
};

if (started) {
  app.quit();
}

if (!config.hardwareAcceleration) {
  app.disableHardwareAcceleration();
}

const acquiredLock = app.requestSingleInstanceLock();

const onNotifyUser = () => {
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
      const plugins: string[] = [
        "inject.js",
        "LocalPlugins.js",
        "aviaclientcategory.js",
        "themes.js",
        "aviafavsystem.js",
        "pluginsupport.js",
        "aviaversion.js",
        "repofrontend.js",
        "ButtonFix.js",
        "headliner.js",
        "aviadesktopversion.js",
        "customFrameNativeMenu.js",
        "disableTrayIcon.js",
        "clientBackup.js",
      ];

      for (const plugin of plugins) {
        const pluginPath: string = path.join(__dirname, plugin);
        const pluginCode: string = fs.readFileSync(pluginPath, "utf8");
        await mainWindow.webContents.executeJavaScript(pluginCode, true);
      }
    } catch {
      /* empty */
    }
  });
};

if (acquiredLock) {
  updateElectronApp({ onNotifyUser });

  app.on("ready", () => {
    applyAppName();
    createMainWindow();
    if (mainWindow) {
      mainWindow.setTitle("AviaClient");
      mainWindow.on("page-title-updated", (e) => {
        e.preventDefault();
        mainWindow.setTitle("AviaClient");
      });
    }
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
      app.setAppUserModelId("AviaClient");
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
      if (mainWindow) {
        mainWindow.setTitle("AviaClient");
        mainWindow.on("page-title-updated", (e) => {
          e.preventDefault();
          mainWindow.setTitle("AviaClient");
        });
      }
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

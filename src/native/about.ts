import { join } from "node:path";

import { BrowserWindow } from "electron";

import { mainWindow } from "./window";

// global reference to about window
export let aboutWindow: BrowserWindow;

// Create our about window
export function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    minWidth: 300,
    minHeight: 300,
    width: 1280,
    height: 720,
    center: true,
    backgroundColor: "#191919",
    frame: true,
    resizable: false,
    minimizable: false,
    parent: mainWindow,
    paintWhenInitiallyHidden: true,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      devTools: false,
    },
  });

  aboutWindow.setMenu(null);

  aboutWindow.loadFile(join(__dirname, "about.html"));

  aboutWindow.on("ready-to-show", () => {
    aboutWindow.show();
  });

  aboutWindow.on("closed", () => {
    aboutWindow = null;
  });
}

import { join } from "node:path";

import { BrowserWindow } from "electron";

import { mainWindow } from "./window";

// global reference to about window
export let aboutWindow: BrowserWindow;

// Create our about window
export function createAboutWindow() {
  // If our about window already exists, show it
  if (aboutWindow) {
    aboutWindow.show();
    return;
  }

  aboutWindow = new BrowserWindow({
    minWidth: 300,
    minHeight: 300,
    width: 1024,
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

  // Remove the default menu
  aboutWindow.setMenu(null);

  aboutWindow.loadFile(join(__dirname, "about.html"));

  aboutWindow.on("ready-to-show", () => {
    aboutWindow.show();
  });

  aboutWindow.on("closed", () => {
    aboutWindow = null;
  });

  // Close window on Escape
  aboutWindow.webContents.on("before-input-event", (event, input) => {
    if (input.key.toLowerCase() === "escape") {
      event.preventDefault();
      aboutWindow.close();
    }
  });
}

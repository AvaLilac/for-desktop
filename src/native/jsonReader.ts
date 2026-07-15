import * as fs from "fs";
import * as path from "path";
import { ipcMain } from "electron";

ipcMain.handle("avia-json-read", (_event, filename: string) => {
    const safe = path.basename(filename);
    if (!safe.endsWith(".json")) throw new Error("Not a JSON file");
    return JSON.parse(fs.readFileSync(path.join(__dirname, safe), "utf8"));
});
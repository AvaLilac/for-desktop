import { ipcMain, app } from "electron";
import * as fs from "fs";
import * as path from "path";

function getPluginsPath(): string {
    return app.isPackaged
    ? process.platform != "win32"
        ? path.join(app.getPath('userData'), "plugins")
        : path.join(process.resourcesPath, "plugins")
    : path.join(app.getAppPath(), 'plugins');
}

function safePath(dir: string, filename: string): string | null {
    const safe = path.basename(filename);
    const full = path.join(dir, safe);
    return full.startsWith(dir) ? full : null;
}

ipcMain.handle("avia-plugins-list", () => {
    const dir = getPluginsPath();
    try {
        if (!fs.existsSync(dir)) return [];
        return fs.readdirSync(dir)
            .filter(f => f.endsWith(".js"))
            .map(f => ({
                name: f.replace(/\.js$/i, ""),
                filename: f
            }));
    } catch {
        return [];
    }
});

ipcMain.handle("avia-plugins-read", (_event, filename: string) => {
    const dir = getPluginsPath();
    try {
        const full = safePath(dir, filename);
        if (!full) return null;
        return fs.readFileSync(full, "utf-8");
    } catch {
        return null;
    }
});

ipcMain.handle("avia-plugins-write", (_event, filename: string, code: string) => {
    const dir = getPluginsPath();
    try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const full = safePath(dir, filename);
        if (!full) return false;
        fs.writeFileSync(full, code, "utf-8");
        return true;
    } catch {
        return false;
    }
});

ipcMain.handle("avia-plugins-create", (_event, filename: string) => {
    const dir = getPluginsPath();
    try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const full = safePath(dir, filename.endsWith(".js") ? filename : filename + ".js");
        if (!full) return false;
        if (fs.existsSync(full)) return false;
        fs.writeFileSync(full, "", "utf-8");
        return true;
    } catch {
        return false;
    }
});

ipcMain.handle("avia-plugins-delete", (_event, filename: string) => {
    const dir = getPluginsPath();
    try {
        const full = safePath(dir, filename);
        if (!full) return false;
        if (!fs.existsSync(full)) return false;
        fs.unlinkSync(full);
        return true;
    } catch {
        return false;
    }
});

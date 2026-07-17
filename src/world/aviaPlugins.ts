import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("aviaPlugins", {
    list: (): Promise<{ name: string; filename: string }[]> =>
        ipcRenderer.invoke("avia-plugins-list"),
    read: (filename: string): Promise<string | null> =>
        ipcRenderer.invoke("avia-plugins-read", filename),
    write: (filename: string, code: string): Promise<boolean> =>
        ipcRenderer.invoke("avia-plugins-write", filename, code),
    create: (filename: string): Promise<boolean> =>
        ipcRenderer.invoke("avia-plugins-create", filename),
    delete: (filename: string): Promise<boolean> =>
        ipcRenderer.invoke("avia-plugins-delete", filename),
});

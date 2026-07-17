import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("aviaJSON", {
    readJSON: (filename: string): Promise<unknown> =>
        ipcRenderer.invoke("avia-json-read", filename),
});
import {contextBridge, ipcRenderer} from "electron";

export const shareScreenElectronAPI = {
    askScreenPermission: () => ipcRenderer.send("ask-screen-permission"),
    success: (id: string, name: string) => ipcRenderer.send("share-screen-success", id, name),
    currentSource: (callback: (sources: {name: string, id: string, thumbnail: string}[]) => void) => ipcRenderer.on("current-source", (event, sources) => callback(sources)),
    cancel: () => ipcRenderer.send("cancel-share-screen"),
    selectSource: (id: string) => ipcRenderer.send("select-source", id),
    stopped: (id: string) => ipcRenderer.send("share-screen-stopped", id)
};

contextBridge.exposeInMainWorld("shareScreenElectronAPI", shareScreenElectronAPI);

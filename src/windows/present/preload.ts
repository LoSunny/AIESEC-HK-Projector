import {contextBridge, ipcRenderer} from "electron";

export const presentElectronAPI = {
    presentNewSize: (x: number, y: number, width: number, height: number) => ipcRenderer.send("present-resize", x, y, width, height),
    onNewSource: (callback: (uuid: string, name: string, sourceId: string) => void) => ipcRenderer.on("new-source", (event, uuid, name, sourceId) => callback(uuid, name, sourceId)),
    onChangeSource: (callback: (uuid: string) => void) => ipcRenderer.on("change-source", (event, uuid) => callback(uuid)),
    onDeleteSource: (callback: (uuid: string) => void) => ipcRenderer.on("delete-source", (event, uuid) => callback(uuid)),
    onFreeze: (callback: () => void) => ipcRenderer.on("freeze", callback),
    onRenameSource: (callback: (uuid: string, newName: string) => void) => ipcRenderer.on("rename-source", (event, uuid, newName) => callback(uuid, newName)),
};

contextBridge.exposeInMainWorld("presentElectronAPI", presentElectronAPI);

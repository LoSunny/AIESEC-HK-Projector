import {contextBridge, ipcRenderer} from "electron";

export const settingsElectronAPI = {
    nextShortcut: (key: string) => ipcRenderer.send("next-shortcut", key),
    prevShortcut: (key: string) => ipcRenderer.send("prev-shortcut", key),
    getNextShortcut: () => ipcRenderer.invoke("get-next-shortcut"),
    getPrevShortcut: () => ipcRenderer.invoke("get-prev-shortcut"),
};

contextBridge.exposeInMainWorld("settingsElectronAPI", settingsElectronAPI);

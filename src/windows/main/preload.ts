// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from "electron";
import {SweetAlertOptions} from "sweetalert2";

export const electronAPI = {
    newWindow: (url: string, uuid: string, name: string) => ipcRenderer.send("new-window", url, uuid, name),
    mainNewSize: (x: number, y: number, width: number, height: number) => ipcRenderer.send("main-resize", x, y, width, height),
    changeActive: (source: string) => ipcRenderer.send("change-active", source),
    changePresent: (source: string) => ipcRenderer.send("change-present", source),
    deleteWindow: (source: string) => ipcRenderer.send("delete-window", source),
    freeze: () => ipcRenderer.send("freeze"),
    renameWindow: (uuid: string, newName: string) => ipcRenderer.send("rename-window", uuid, newName),
    nextShortcut: (key: string) => ipcRenderer.send("next-shortcut", key),
    prevShortcut: (key: string) => ipcRenderer.send("prev-shortcut", key),
    swal: (callback: (option: SweetAlertOptions) => void) => ipcRenderer.on("swal", (event, option: SweetAlertOptions) => callback(option)),
    shareScreen: () => ipcRenderer.send("share-screen"),
    newScreenAccepted: (callback: (uuid: string, name: string) => void) => ipcRenderer.on("new-screen-accepted", (event, uuid: string, name: string) => callback(uuid, name)),
    screenStopped: (callback: (uuid: string) => void) => ipcRenderer.on("screen-stopped", (event, uuid: string) => callback(uuid)),
    pdf: (name: string, data: string) => ipcRenderer.send("new-pdf", name, data),
    volumeMute: (uuid: string) => ipcRenderer.send("volume-mute", uuid),
    cloudflareTunnelURL: () => ipcRenderer.invoke("cloudflare-tunnel-url"),
};

contextBridge.exposeInMainWorld("api", electronAPI);

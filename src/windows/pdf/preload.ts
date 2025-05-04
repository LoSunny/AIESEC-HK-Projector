import {contextBridge, ipcRenderer} from "electron";

export const pdfElectronAPI = {
    hasPDF: (callback: (data: string) => void) => ipcRenderer.on("new-pdf-viewer", (event, data: string) => callback(data)),
};

contextBridge.exposeInMainWorld("pdfElectronAPI", pdfElectronAPI);

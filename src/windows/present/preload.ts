import {contextBridge, ipcRenderer} from "electron";

export const presentElectronAPI = {
    presentNewSize: (x: number, y: number, width: number, height: number) => ipcRenderer.send("present-resize", x, y, width, height),
    onNewSource: (callback: (uuid: string, sourceId: string) => void) => ipcRenderer.on("new-source", (event, uuid, sourceId) => callback(uuid, sourceId)),
    onChangeSource: (callback: (uuid: string) => void) => ipcRenderer.on("change-source", (event, uuid) => callback(uuid)),
    onDeleteSource: (callback: (uuid: string) => void) => ipcRenderer.on("delete-source", (event, uuid) => callback(uuid)),
    onFreeze: (callback: () => void) => ipcRenderer.on("freeze", callback),
    onOffer: (callback: (id: string, offer: RTCSessionDescriptionInit) => void) => ipcRenderer.on("present-offer", (event, id, offer) => callback(id, offer)),
    onAnswer: (callback: (id: string, answer: RTCSessionDescriptionInit) => void) => ipcRenderer.on("present-answer", (event, id, answer) => callback(id, answer)),
    onNewUser: (callback: (id: string) => void) => ipcRenderer.on("present-new-user", (event, id) => callback(id)),
    onIceCandidate: (callback: (id: string, candidate: RTCIceCandidateInit) => void) => ipcRenderer.on("present-icecandidate", (event, id, candidate) => callback(id, candidate)),
    presentOffer: (id: string, offer: object) => ipcRenderer.send("present-offer", id, offer),
    presentAnswer: (id: string, offer: object) => ipcRenderer.send("present-answer", id, offer),
    presentIceCandidate: (id: string, candidate: object) => ipcRenderer.send("present-icecandidate", id, candidate),
    onObserverDisconnect: (callback: (id: string) => void) => ipcRenderer.on("observer-disconnect", (event, id) => callback(id)),
    onObserverChangeSource: (callback: (id: string, uuid: string) => void) => ipcRenderer.on("observer-change-source", (event, id, uuid) => callback(id, uuid)),
    liveView: () => ipcRenderer.invoke("live-view"),
};

contextBridge.exposeInMainWorld("presentElectronAPI", presentElectronAPI);

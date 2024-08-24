// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from 'electron';

export const electronAPI = {
    newWindow: (url: string, uuid: string) => ipcRenderer.send('new-window', url, uuid),
    resize: (x: number, y: number, width: number, height: number) => ipcRenderer.send('main-resize', x, y, width, height),
    changeActive: (source: string) => ipcRenderer.send('change-active', source),
    changePresent: (source: string) => ipcRenderer.send('change-present', source),
    deleteWindow: (source: string) => ipcRenderer.send('delete-window', source),
    freeze: () => ipcRenderer.send('freeze'),
    nextShortcut: (key: string) => ipcRenderer.send('next-shortcut', key),
    prevShortcut: (key: string) => ipcRenderer.send('prev-shortcut', key),
}

contextBridge.exposeInMainWorld('api', electronAPI);

import {BrowserWindow, globalShortcut, ipcMain} from "electron";
import {getPresentView, ShareScreenView} from "./views";
import * as process from "node:process";
import * as path from "node:path";
import * as fs from "node:fs";
import {execSync} from "node:child_process";
import {getBinPath} from "../windows/electronUtils";

const errorSwal = {
    icon: "error",
    toast: true,
    position: "top-end",
    timer: 1000
};

export function setupShortcuts(mainWindow: () => BrowserWindow) {
    let nextKey = "";
    let macBin = path.join(getBinPath(), "shortcut.swift");
    if (!fs.existsSync(macBin)) macBin = null;
    let winBin = path.join(getBinPath(), "shortcut.exe");
    if (!fs.existsSync(winBin)) winBin = null;

    ipcMain.on("next-shortcut", (event, key: string) => {
        console.log("next-shortcut", key);
        if (nextKey !== "") {
            try {
                globalShortcut.unregister(nextKey);
            } catch (_e) {
            }
        }
        if (key === "") return;
        nextKey = key;
        try {
            globalShortcut.register(key, () => {
                const presentView = getPresentView();
                if (presentView === undefined) return mainWindow().webContents.send("swal", {title: "No screen to present", ...errorSwal});
                if (presentView.type === "screenshare" && (!["darwin", "win32"].includes(process.platform) || (process.platform == "darwin" && macBin == null)))
                    mainWindow().webContents.send("swal", {title: "Screen share is not supported", ...errorSwal});
                else
                    mainWindow().webContents.send("swal", {...errorSwal, title: "Clicked Next Slide", icon: "success"});

                if (presentView.type == "screenshare") {
                    const view = presentView as ShareScreenView;
                    if (process.platform == "darwin" && macBin !== null && view.pid !== undefined) {
                        // https://stackoverflow.com/questions/54337561/send-keypress-to-specific-window-on-mac
                        // https://stackoverflow.com/questions/3202629/where-can-i-find-a-list-of-mac-virtual-key-codes
                        execSync(`swift "${macBin}" ${view.pid} 121`);
                    } else if (process.platform == "win32" && winBin !== null && view.pid !== undefined) {
                        // https://github.com/awaescher/SendKeys
                        execSync(`${winBin} -pid:${view.pid} "{PGDN}"`);
                        // Alternative: https://github.com/go-vgo/robotgo
                    }
                } else
                    ["keyDown", "char", "keyUp"].forEach(keyType => {
                        presentView.webContents[0]?.webContents.sendInputEvent({
                            type: keyType as unknown as "keyDown" | "char" | "keyUp",
                            keyCode: "PageDown"
                        });
                    });
            });
        } catch (_e) {
            mainWindow().webContents.send("swal", {title: "Unable to parse shortcut, please choose a different keybind", ...errorSwal});
        }
    });
    let prevKey = "";
    ipcMain.on("prev-shortcut", (event, key: string) => {
        console.log("prev-shortcut", key);
        if (prevKey !== "") {
            globalShortcut.unregister(prevKey);
        }
        if (key === "") return;
        prevKey = key;
        globalShortcut.register(key, () => {
            const presentView = getPresentView();
            if (presentView === undefined) return;
            if (presentView.type === "screenshare" && (!["darwin", "win32"].includes(process.platform) || (process.platform == "darwin" && macBin == null)))
                mainWindow().webContents.send("swal", {title: "Screen share is not supported", ...errorSwal});
            else
                mainWindow().webContents.send("swal", {...errorSwal, title: "Clicked Previous Slide", icon: "success"});

            if (presentView.type == "screenshare") {
                const view = presentView as ShareScreenView;
                if (process.platform == "darwin" && macBin !== null && view.pid !== undefined)
                    execSync(`swift "${macBin}" ${view.pid} 116`);
                else if (process.platform == "win32" && winBin !== null && view.pid !== undefined)
                    execSync(`${winBin} -pid:${view.pid} "{PGUP}"`);
            } else
                ["keyDown", "char", "keyUp"].forEach(keyType => {
                    presentView.webContents[0]?.webContents.sendInputEvent({
                        type: keyType as unknown as "keyDown" | "char" | "keyUp",
                        keyCode: "PageUp"
                    });
                });
        });
    });
}

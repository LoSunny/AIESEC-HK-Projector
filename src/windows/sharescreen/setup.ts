import {
    app,
    BrowserWindow,
    desktopCapturer,
    DesktopCapturerSource,
    ipcMain,
    shell,
    Streams,
    systemPreferences,
    WebContentsView
} from "electron";
import * as os from "node:os";
import {getMainSize, resizeView} from "../../controller/resizer";
import {MenuFunctions} from "../../controller/menu";
import {addView, deactiveAllViews} from "../../controller/views";
import * as child_process from "node:child_process";
import {ChildProcess, spawn} from "node:child_process";
import * as process from "node:process";
import * as path from "node:path";
import {openWindows} from "get-windows";
import {newSource} from "../observer/server";
import {getBinPath} from "../electronUtils";

export function setupShareScreen(mainWindow: () => BrowserWindow, presentWindow: () => BrowserWindow,
                                 SHARE_SCREEN_WINDOW_WEBPACK_ENTRY: string, SHARE_SCREEN_WINDOW_PRELOAD_WEBPACK_ENTRY: string,
                                 newViewMenu: MenuFunctions["newViewMenu"]) {
    let destroyView: NodeJS.Timeout;

    function setupDestroyViewTimer() {
        destroyView = setTimeout(() => {
            console.log("Timeout reached, destroying view");
            mainWindow().webContents.send("swal", {
                title: "Screen sharing request timed out",
                icon: "error",
                timer: 3000,
                timerProgressBar: true
            });
            view?.webContents.close();
            view = null;
        }, 60000);
    }

    let streams: DesktopCapturerSource[] = [];
    let callbackOfSources: (streams: Streams) => void;

    const screens: { name: string, pid: number }[] = [];
    let macOS15Timer: NodeJS.Timeout;
    let macOS15Process: ChildProcess;
    let macOS15ProcessID: number;

    let view: WebContentsView | null = null;
    ipcMain.on("share-screen", () => {
        if (view) {
            return mainWindow().webContents.send("swal", {
                title: "Screen sharing already in progress",
                icon: "info"
            });
        }
        console.log("Sharing screen request received");
        view = new WebContentsView({
            webPreferences: {
                partition: "share-screen" + Date.now(),
                preload: SHARE_SCREEN_WINDOW_PRELOAD_WEBPACK_ENTRY,
                disableHtmlFullscreenWindowResize: true,
            },
        });
        view.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
            clearTimeout(macOS15Timer);
            desktopCapturer.getSources({
                types: ["screen", "window"],
                thumbnailSize: {width: 300, height: 300}
            }).then(async (sources) => {
                streams = sources;
                callbackOfSources = callback;
                mainWindow().contentView.addChildView(view);
                view.setBounds(getMainSize());
                clearTimeout(destroyView);
                setupDestroyViewTimer();
                view.webContents.send("current-source", sources.map(source => {
                    return {
                        name: source.name,
                        id: source.id,
                        thumbnail: source.thumbnail.toDataURL()
                    };
                }));
                if (process.platform === "darwin") {
                    const windows = child_process.execSync(path.resolve(getBinPath(), "screens")).toString().split("\n");
                    for (const window of windows) {
                        const match = window.match(/Window Name: \((.+?)\), PID: \((\d+)\)/);
                        if (!match) continue;
                        const name = match[1];
                        const pid = parseInt(match[2]);
                        screens.push({name, pid});
                    }
                } else if (process.platform === "win32") {
                    openWindows().then(windows => windows.forEach(window => screens.push({
                        name: window.title,
                        pid: window.owner.processId
                    })));
                }
            });
        }, {useSystemPicker: true});
        view.webContents.loadURL(SHARE_SCREEN_WINDOW_WEBPACK_ENTRY).then(() => {
            if (process.platform === "darwin")
                macOS15Timer = setTimeout(() => {
                    const pid = process.pid;
                    const title = process.title.split("/");
                    macOS15Process = spawn("log", ["stream", "--predicate", `process=="${title[title.length - 1]}"`]);
                    macOS15Process.stdout.on("data", (datas: object) => {
                        for (const data of datas.toString().split("\n")) {
                            if (!data.includes(pid.toString())) continue;
                            if (!data.includes("ScreenCaptureKit")) continue;
                            const match = data.match(/processID=(\d+)/);
                            if (!match) continue;
                            macOS15ProcessID = parseInt(match[1]);
                            macOS15Process.kill();
                            return;
                        }
                    });
                }, 500);
        });
        // view.webContents.openDevTools({mode: 'detach'});

        setupDestroyViewTimer();
    });

    ipcMain.on("ask-screen-permission", () => {
        if (systemPreferences.getMediaAccessStatus("screen") != "granted") {
            if (os.platform() === "darwin") {
                shell.openExternal("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture");
                mainWindow().webContents.send("swal", {
                    title: "Please allow screen sharing",
                    icon: "info"
                });
            } else mainWindow().webContents.send("swal", {
                title: "Screen sharing denied",
                icon: "error"
            });
        } else {
            mainWindow().webContents.send("swal", {
                title: "Screen sharing denied",
                icon: "error"
            });
        }
    });

    ipcMain.on("share-screen-success", (event, uuid: string, name: string) => {
        if (destroyView) clearTimeout(destroyView);
        macOS15Process?.kill();

        deactiveAllViews();
        presentWindow().webContents.send("new-source", uuid, view.webContents.getMediaSourceId(presentWindow().webContents));
        mainWindow().contentView.addChildView(view);
        // view.webContents.openDevTools({mode: 'detach'});

        addView({
            id: uuid,
            name,
            type: "screenshare",
            webContents: [view],
            active: true,
            present: false,
            ...[
                macOS15ProcessID ? {pid: macOS15ProcessID} : []
            ][0],
            ...[
                screens.find(screen => screen.name === name) ? {pid: screens.find(screen => screen.name === name)!.pid} : []
            ][0]
        });

        resizeView();
        newSource(uuid, name);
        if (!app.isPackaged) newViewMenu(view, uuid, `Screen Share ${uuid.split("-")[0]}`);
        mainWindow().webContents.send("new-screen-accepted", uuid, name);
        if (process.platform === "darwin") systemPreferences.isTrustedAccessibilityClient(true);
        view = null;
    });

    ipcMain.on("cancel-share-screen", () => {
        clearTimeout(destroyView);
        mainWindow().webContents.send("swal", {
            title: "Screen sharing request cancelled",
            icon: "info",
            timer: 1000,
            timerProgressBar: true
        });
        view?.webContents.close();
        view = null;
    });

    ipcMain.on("select-source", (event, id: string) => {
        const returns: Streams = {video: streams.find(source => source.id === id)};
        callbackOfSources(returns);
        streams = [];
        callbackOfSources = null;
    });

    ipcMain.on("share-screen-stopped", (event, id: string) => {
        if (!mainWindow().webContents.isDestroyed()) mainWindow().webContents.send("screen-stopped", id);
    });
}

import {app, BrowserWindow, ipcMain, WebContentsView} from "electron";
import {MenuFunctions} from "../../controller/menu";
import {addView, deactiveAllViews} from "../../controller/views";
import {resizeView} from "../../controller/resizer";

export function setupPDFScreen(mainWindow: () => BrowserWindow, presentWindow: () => BrowserWindow,
                               PDF_WINDOW_WEBPACK_ENTRY: string, PDF_WINDOW_PRELOAD_WEBPACK_ENTRY: string,
                               newViewMenu: MenuFunctions["newViewMenu"]) {

    ipcMain.on("new-pdf", (event, name: string, data: string) => {
        const uuid = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
        const view = new WebContentsView({
            webPreferences: {
                partition: "pdf" + Date.now(),
                preload: PDF_WINDOW_PRELOAD_WEBPACK_ENTRY,
                disableHtmlFullscreenWindowResize: true,
            },
        });
        // Disable cors for pdf
        view.webContents.session.webRequest.onHeadersReceived({urls: [data]}, (details, callback) => {
            const headers = details.responseHeaders;
            delete headers["content-security-policy"];
            delete headers["content-security-policy-report-only"];
            callback({cancel: false, responseHeaders: headers});
        });
        view.webContents.loadURL(PDF_WINDOW_WEBPACK_ENTRY).then(() => view.webContents.send("new-pdf-viewer", data));

        deactiveAllViews();
        presentWindow().webContents.send("new-source", uuid, view.webContents.getMediaSourceId(presentWindow().webContents));
        mainWindow().contentView.addChildView(view);
        // view.webContents.openDevTools({mode: "detach"});
        addView({id: uuid, name,type: "general", webContents: [view], active: true, present: false});
        resizeView();
        if (!app.isPackaged) newViewMenu(view, uuid, `PDF: ${name}`);
        mainWindow().webContents.send("new-screen-accepted", uuid, name);
    });
}

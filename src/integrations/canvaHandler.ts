import {BrowserWindow, WebContentsView, WindowOpenHandlerResponse} from "electron";
import {getView} from "../controller/views";
import {resizeView} from "../controller/resizer";
import {MenuFunctions} from "../controller/menu";

export function canvaWindowOpenHandler(CANVA_WINDOW_PRELOAD_WEBPACK_ENTRY: string, mainWindow: BrowserWindow, view: WebContentsView, url: string, uuid: string, newInnerViewMenu: MenuFunctions["newInnerViewMenu"], deleteInnerViewMenu: MenuFunctions["deleteInnerViewMenu"]): WindowOpenHandlerResponse {
    return {
        action: "allow",
        overrideBrowserWindowOptions: {
            webPreferences: {
                preload: CANVA_WINDOW_PRELOAD_WEBPACK_ENTRY,
                partition: "persist:canva",
                // partition: 'test',
            },
            // show: false
        },
        createWindow: options => {
            const innerView = new WebContentsView(options);
            innerView.webContents.loadURL(url);
            // innerView.webContents.openDevTools({mode: 'detach'});
            innerView.webContents.on("did-finish-load", () =>
                innerView.webContents.insertCSS("div > div > button[aria-label=\"Exit presentation\"] {display: none;}"));
            innerView.webContents.on("destroyed", () => {
                if (view.webContents.isDestroyed()) return;
                mainWindow.contentView.removeChildView(innerView);
                getView(uuid).webContents.splice(0, 1);
                resizeView();
                deleteInnerViewMenu(uuid);
            });
            getView(uuid).webContents.splice(0, 0, innerView);
            mainWindow.contentView.addChildView(innerView);
            resizeView();
            newInnerViewMenu(innerView, uuid);
            return innerView.webContents;
        }
    };
}

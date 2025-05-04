import {BrowserWindow, WebContentsView, WindowOpenHandlerResponse} from "electron";
import {getView} from "../controller/views";
import {resizeView} from "../controller/resizer";

export function googleWindowOpenHandler(mainWindow: BrowserWindow, url: string, uuid: string): WindowOpenHandlerResponse {
    const response: WindowOpenHandlerResponse = {
        action: "allow",
        overrideBrowserWindowOptions: {
            webPreferences: {
                partition: "persist:canva",
                webSecurity: false,
            },
            // show: false
        },
        createWindow: options => {
            // mainWindow.contentView.removeChildView(getView(uuid).webContents[0]);
            const view = new WebContentsView(options);
            view.webContents.loadURL(url);
            getView(uuid).webContents.splice(0, 0, view);
            // mainWindow.contentView.addChildView(view);
            resizeView();
            return view.webContents;
        }
    };
    return response;
}

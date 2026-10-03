import {BrowserWindow, ipcMain} from "electron";
import {getView} from "../../controller/views";

// Register in the main process; only the controller may navigate its page views.
ipcMain.on("browser-command", (event, id: string, command: string, url?: string) => {
    const owner = BrowserWindow.fromWebContents(event.sender);
    const view = getView(id);
    const contents = view?.webContents[0]?.webContents;
    if (!owner || !contents || contents.isDestroyed() || view.type === "screenshare" ||
        !owner.contentView.children.includes(view.webContents[0])) return;
    const sendState = () => {
        if (event.sender.isDestroyed() || contents.isDestroyed()) return;
        event.sender.send("browser-state", id, {
            url: contents.getURL(), back: contents.navigationHistory.canGoBack(),
            forward: contents.navigationHistory.canGoForward(), loading: contents.isLoading()
        });
    };
    if (command === "watch") {
        if (!watched.has(contents.id)) {
            watched.add(contents.id);
            ["did-navigate", "did-navigate-in-page", "did-start-loading", "did-stop-loading"].forEach(name => contents.on(name as "did-stop-loading", sendState));
            contents.once("destroyed", () => watched.delete(contents.id));
        }
    } else if (command === "back" && contents.navigationHistory.canGoBack()) contents.navigationHistory.goBack();
    else if (command === "forward" && contents.navigationHistory.canGoForward()) contents.navigationHistory.goForward();
    else if (command === "reload") contents.reload();
    else if (command === "navigate" && url) {
        try {
            const target = new URL(url);
            if (["https:", "http:"].includes(target.protocol)) void contents.loadURL(target.href).catch(() => sendState());
        } catch { /* Invalid addresses are rejected by the renderer too. */
        }
    }
    sendState();
});
const watched = new Set<number>();

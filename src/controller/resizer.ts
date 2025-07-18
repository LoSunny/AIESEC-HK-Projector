import {ipcMain} from "electron";
import {getViews} from "./views";

let mainSize: { x: number, y: number, width: number, height: number };
let presentSize: { x: number, y: number, width: number, height: number };

export function setupResizer() {
    ipcMain.on("main-resize", (event, x: number, y: number, width: number, height: number) => {
        mainSize = {x, y, width, height};
        console.log("main-resize", mainSize);
        resizeView();
    });
    ipcMain.on("present-resize", (event, x: number, y: number, width: number, height: number) => {
        presentSize = {x, y, width, height};
        console.log("present-resize", presentSize);
        resizeView();
    });
}


export function resizeView() {
    if (!mainSize || !presentSize) return;
    const widthRatio = mainSize.width / presentSize.width;
    const heightRatio = mainSize.height / presentSize.height;
    const ratio = Math.min(widthRatio, heightRatio);
    const width = presentSize.width * ratio;
    const height = presentSize.height * ratio;

    for (let view of getViews()) {
        if (view.active) view.webContents[0]?.setBounds({x: mainSize.x, y: mainSize.y, width, height});
        // The non-active screen still need to be in viewport, or else won't update render (i.e. mouse shown even coordinate is out of screen)
        else if (mainSize.width > width)
            view.webContents[0]?.setBounds({
                x: mainSize.x + mainSize.width - 1,
                y: mainSize.y,
                width,
                height
            });
        else if (mainSize.height > height)
            view.webContents[0]?.setBounds({
                x: mainSize.x,
                y: mainSize.y + mainSize.height - 1,
                width,
                height
            });
        else console.log("Unknown resize", mainSize, width, height);

        if (view.webContents.length === 2)
            view.webContents[1]?.setBounds({
                x: mainSize.width > width ? mainSize.x + mainSize.width - 1 : mainSize.x,
                y: mainSize.height > height ? mainSize.y + mainSize.height - 1 : mainSize.y,
                width: presentSize.width,
                height: presentSize.height
            });
        // console.log('resize', view.id, view.active, view.present, view.webContents.map(w => w.getBounds()));
    }
}

export function getMainSize() {
    return mainSize;
}

import {ElectronBlocker} from '@ghostery/adblocker-electron';
import {
    app,
    BrowserWindow,
    dialog,
    globalShortcut,
    ipcMain,
    Menu,
    shell,
    WebContentsView,
    WindowOpenHandlerResponse
} from 'electron';
import * as path from "node:path";
import fetch from 'cross-fetch';

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

app.setName('AIESEC HK Projector');
const isMac = process.platform === 'darwin'
const macAppMenu: Electron.MenuItemConstructorOptions = {role: 'appMenu'};
const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [macAppMenu] : []),
    {role: 'fileMenu'},
    {role: 'editMenu'},
    {role: 'viewMenu'},
    {role: 'windowMenu'},
    {
        role: 'help', submenu: [
            {label: "Learn More", click: () => shell.openExternal('https://sunnylo.tk')},
            {label: "By Sunny"}
        ]
    }
];
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

interface View {
    id: string;
    type: 'general' | 'canva' | 'google';
    webContents: WebContentsView[];
    active: boolean;
    present: boolean;
}

let mainWindow: BrowserWindow;
let presentWindow: BrowserWindow;
let views: View[] = [{
    id: 'black',
    type: 'general',
    webContents: [],
    active: true,
    present: true
}];
let mainSize: { x: number, y: number, width: number, height: number };
let presentSize: { x: number, y: number, width: number, height: number };

const createWindow = (): void => {
    mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            partition: 'main',
        },
    });
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    presentWindow = new BrowserWindow({
        height: 600,
        width: 800,
        webPreferences: {
            preload: path.join(__dirname, 'integrations', 'present.preload.js'),
            partition: 'present'
        },
        autoHideMenuBar: true,
    });
    presentWindow.loadFile(path.join(__dirname, 'integrations', 'present.html'));
    // presentWindow.webContents.openDevTools({mode: 'detach'});


    let closingWindow = false;
    [mainWindow, presentWindow].forEach(win => {
        win.addListener('close', e => {
            if (closingWindow) return;
            const response = dialog.showMessageBoxSync(win, {
                type: 'info',
                title: 'Confirm',
                message: 'Do you really want to close the app?',
                buttons: ['Yes', 'No']
            })
            if (response === 1) return e.preventDefault();
            closingWindow = true;
            app.quit();
        });
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {

    ipcMain.on('new-window', (event, url: string, uuid: string) => {
        if (!url.startsWith("http://") && !url.startsWith("https://")) return;
        views.forEach(view => view.active = false);
        const type = url.includes('canva.com') ? 'canva' : url.includes('docs.google.com') ? 'google' : 'general';
        let view = new WebContentsView({
            webPreferences: {
                partition: 'persist:canva',
                // partition: 'test',
                preload: path.join(__dirname, 'integrations', 'preload.js'),
                disableHtmlFullscreenWindowResize: true,
            },
        });
        view.webContents.setWindowOpenHandler(({url}) => {
            if (type === 'canva' && url === "https://www.canva.com/popout") {
                // subwin.hide();
                const response: WindowOpenHandlerResponse = {
                    action: 'allow',
                    overrideBrowserWindowOptions: {
                        webPreferences: {
                            preload: path.join(__dirname, 'integrations', 'canva.js'),
                            partition: 'persist:canva',
                            // partition: 'test',
                        },
                        // show: false
                    },
                    createWindow: options => {
                        mainWindow.contentView.removeChildView(views.find(view => view.id === uuid).webContents[0]);
                        const view = new WebContentsView(options);
                        view.webContents.loadURL(url);
                        views.find(view => view.id === uuid).webContents.splice(0, 0, view);
                        mainWindow.contentView.addChildView(view);
                        resize();
                        return view.webContents;
                    }
                }
                return response;
            } else if (type === 'google' && url === "about:blank") {
                return {
                    action: 'allow',
                    overrideBrowserWindowOptions: {
                        webPreferences: {
                            partition: 'persist:canva',
                        },
                        // show: false
                    },
                    createWindow: options => {
                        // mainWindow.contentView.removeChildView(views.find(view => view.id === uuid).webContents[0]);
                        const view = new WebContentsView(options);
                        view.webContents.loadURL(url);
                        views.find(view => view.id === uuid).webContents.splice(0, 0, view);
                        // mainWindow.contentView.addChildView(view);
                        resize();
                        return view.webContents;
                    }
                }
            }

            console.log('Deny new window', url);
            return {
                action: 'deny'
            }
        });
        presentWindow.webContents.send('new-source', uuid, view.webContents.getMediaSourceId(presentWindow.webContents));
        mainWindow.contentView.addChildView(view);
        view.setBounds(mainSize);
        // view.webContents.openDevTools({mode: 'detach'});
        views.push({id: uuid, type, webContents: [view], active: true, present: false});

        ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
            blocker.enableBlockingInSession(view.webContents.session);
            view.webContents.loadURL(url);
        }).catch(() => view.webContents.loadURL(url));
    });
    ipcMain.on('main-resize', (event, x: number, y: number, width: number, height: number) => {
        mainSize = {x, y, width, height};
        console.log('main-resize', mainSize);
        resize();
    });
    ipcMain.on('present-resize', (event, x: number, y: number, width: number, height: number) => {
        presentSize = {x, y, width, height};
        console.log('present-resize', presentSize);
        resize();
    });
    ipcMain.on('change-active', (event, source: string) => {
        const view = views.find(view => view.active);
        if (view) {
            view.active = false;
            if (view.webContents.length !== 0) mainWindow.contentView.removeChildView(view.webContents[0]);
        }
        const newView = views.find(view => view.id === source);
        if (!newView) return;
        newView.active = true;
        if (newView.webContents.length !== 0) mainWindow.contentView.addChildView(newView.webContents[0]);
    });
    ipcMain.on('change-present', (event, source: string) => {
        views.forEach(view => view.present = view.id === source);
        presentWindow.webContents.send('change-source', source);
    });
    ipcMain.on('delete-window', (event, source: string) => {
        const view = views.find(view => view.id === source);
        if (!view) return;
        presentWindow.webContents.send('delete-source', source);
        view.webContents.forEach(webContents => {
            mainWindow.contentView.removeChildView(webContents);
        });
        views = views.filter(view => view.id !== source);
    });
    ipcMain.on('freeze', (event) => presentWindow.webContents.send('freeze'));
    let nextKey = "";
    ipcMain.on('next-shortcut', (event, key: string) => {
        console.log('next-shortcut', key);
        if (nextKey !== "") {
            globalShortcut.unregister(nextKey);
        }
        if (key === "") return;
        nextKey = key;
        globalShortcut.register(key, () => {
            mainWindow.webContents.executeJavaScript("Swal.fire({title: 'Clicked Next Slide', icon: 'success', toast: true, position: 'top-end', timer: 1000});");
            views.find(view => view.present).webContents[0]?.webContents.sendInputEvent({
                type: 'keyDown',
                keyCode: 'PageDown'
            });
            views.find(view => view.present).webContents[0]?.webContents.sendInputEvent({
                type: 'char',
                keyCode: 'PageDown'
            });
            views.find(view => view.present).webContents[0]?.webContents.sendInputEvent({
                type: 'keyUp',
                keyCode: 'PageDown'
            });
        });
    });
    let prevKey = "";
    ipcMain.on('prev-shortcut', (event, key: string) => {
        console.log('prev-shortcut', key);
        if (prevKey !== "") {
            globalShortcut.unregister(prevKey);
        }
        if (key === "") return;
        prevKey = key;
        globalShortcut.register(key, () => {
            mainWindow.webContents.executeJavaScript("Swal.fire({title: 'Clicked Previous Slide', icon: 'success', toast: true, position: 'top-end', timer: 1000});");
            views.find(view => view.present).webContents[0]?.webContents.sendInputEvent({
                type: 'keyDown',
                keyCode: 'PageUp'
            });
            views.find(view => view.present).webContents[0]?.webContents.sendInputEvent({
                type: 'char',
                keyCode: 'PageUp'
            });
            views.find(view => view.present).webContents[0]?.webContents.sendInputEvent({
                type: 'keyUp',
                keyCode: 'PageUp'
            });
        });
    });
    createWindow();
});

function resize() {
    const view = views.find(view => view.active);
    if (!view || !mainSize || !presentSize) return;
    const widthRatio = mainSize.width / presentSize.width;
    const heightRatio = mainSize.height / presentSize.height;
    const ratio = Math.min(widthRatio, heightRatio);
    const width = presentSize.width * ratio;
    const height = presentSize.height * ratio;

    view.webContents.forEach(webContents => webContents.setBounds({
        x: mainSize.x,
        y: mainSize.y,
        width,
        height
    }));
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
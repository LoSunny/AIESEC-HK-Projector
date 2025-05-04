import {app, BrowserWindow, Menu, MenuItemConstructorOptions, shell, WebContentsView} from "electron";
import {getView} from "./views";

export function setupMenu(mainWindow: () => BrowserWindow, presentWindow: () => BrowserWindow) {
    const isMac = process.platform === "darwin";
    const macAppMenu: Electron.MenuItemConstructorOptions = {role: "appMenu"};
    const template: Electron.MenuItemConstructorOptions[] = [
        ...(isMac ? [macAppMenu] : []),
        {role: "fileMenu"},
        {role: "editMenu"},
        {role: "viewMenu"},
        {role: "windowMenu"},
        {
            role: "help", submenu: [
                {
                    label: "Learn More",
                    click: () => shell.openExternal("https://github.com/LoSunny/AIESEC-HK-Projector")
                },
                {label: "By Sunny", click: () => shell.openExternal("https://www.sunnylo.tk")}
            ]
        },
        ...(app.isPackaged ? [] : [{
            label: "Debug", submenu: [
                {label: "Main Window DevTools", click: () => mainWindow().webContents.openDevTools({mode: "detach"})},
                {
                    label: "Present Window DevTools",
                    click: () => presentWindow().webContents.openDevTools({mode: "detach"})
                },
            ]
        }]),
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));

    return {
        newViewMenu: (view: WebContentsView, uuid: string, name: string) => {
            (template[template.length - 1].submenu as MenuItemConstructorOptions[]).push({
                label: name + " DevTools",
                id: uuid,
                submenu: [{
                    label: view.webContents.getTitle(),
                    click: () => view.webContents.openDevTools({mode: "detach"}),
                    sublabel: "Main"
                }]
            });
            view.webContents.on("page-title-updated", (e, title) => {
                const item = (template[template.length - 1].submenu as MenuItemConstructorOptions[]).find(item => item.id === uuid);
                if (!item) return;
                (item.submenu as MenuItemConstructorOptions[]).find(item => item.sublabel === "Main").label = title;
                Menu.setApplicationMenu(Menu.buildFromTemplate(template));
            });
            Menu.setApplicationMenu(Menu.buildFromTemplate(template));
        },
        deleteViewMenu: (uuid: string) => {
            (template[template.length - 1].submenu as MenuItemConstructorOptions[]).splice(
                (template[template.length - 1].submenu as MenuItemConstructorOptions[]).findIndex(item => item.id === uuid), 1);
            Menu.setApplicationMenu(Menu.buildFromTemplate(template));
        },
        newInnerViewMenu: (innerView: WebContentsView, uuid: string) => {
            ((template[template.length - 1].submenu as MenuItemConstructorOptions[]).find(item => item.id === uuid).submenu as MenuItemConstructorOptions[]).push({
                label: innerView.webContents.getTitle(),
                click: () => getView(uuid).webContents[0].webContents.openDevTools({mode: "detach"}),
                sublabel: "Inner"
            });
            innerView.webContents.on("page-title-updated", (e, title) => {
                const item = (template[template.length - 1].submenu as MenuItemConstructorOptions[]).find(item => item.id === uuid);
                if (!item) return;
                (item.submenu as MenuItemConstructorOptions[]).find(item => item.sublabel === "Inner").label = title;
                Menu.setApplicationMenu(Menu.buildFromTemplate(template));
            });
            Menu.setApplicationMenu(Menu.buildFromTemplate(template));
        },
        deleteInnerViewMenu: (uuid: string) => {
            ((template[template.length - 1].submenu as MenuItemConstructorOptions[]).find(item => item.id === uuid).submenu as MenuItemConstructorOptions[]).pop();
            Menu.setApplicationMenu(Menu.buildFromTemplate(template));
        }
    };
}

export type MenuFunctions = ReturnType<typeof setupMenu>;

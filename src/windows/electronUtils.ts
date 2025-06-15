import {app} from "electron";
import * as path from "node:path";
import * as process from "node:process";

export function getBinPath() {
    if (app.isPackaged) return path.resolve(path.join(process.resourcesPath, "bin"));
    else return path.resolve(__dirname, "..", "..", "bin");
}

export function getSpotifyExtensionPath() {
    if (app.isPackaged) return path.resolve(path.join(process.resourcesPath, "src", "assets", "spotify-extension"));
    else return path.resolve(__dirname, "..", "..", "src", "assets", "spotify-extension");
}

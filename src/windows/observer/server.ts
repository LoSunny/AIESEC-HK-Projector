import Koa from "koa";
import {createServer, Server} from "node:http";
import child_process, {ChildProcess} from "node:child_process";
import {AddressInfo} from "node:net";
import {Server as IOServer, Socket} from "socket.io";
import * as path from "node:path";
import * as fs from "node:fs";
import {Readable} from "node:stream";
import {ReadableStream} from "node:stream/web";
import {BrowserWindow, ipcMain} from "electron";
import {getViews} from "../../controller/views";
import {getBinPath} from "../electronUtils";

let server: Server;
let ioServer: IOServer;
let cloudflared: ChildProcess;
let cloudflareURL: string;

export function setupServer(presentWindow: () => BrowserWindow, OBSERVER_WINDOW_WEBPACK_ENTRY: string) {
    const app = new Koa();

    app.use(async ctx => {
        let returns = OBSERVER_WINDOW_WEBPACK_ENTRY;
        if (ctx.path === "/") {
            ctx.type = "html";
        } else if (ctx.path === "/observer_window/index.js") {
            ctx.type = "js";
            returns = returns.replace("index.html", "index.js");
            if (!returns.endsWith(".js")) returns += "/index.js";
        } else {
            ctx.status = 404;
            return;
        }
        if (returns.startsWith("file://")) {
            ctx.body = fs.readFileSync(returns.replace("file://", ""));
        } else if (returns.startsWith("http")) {
            const res = await fetch(returns);
            ctx.body = Readable.fromWeb(res.body as ReadableStream<any>);
        }
    });

    server = createServer(app.callback());
    ioServer = new IOServer(server);
    const clients: Record<string, Socket> = {};
    ioServer.on("connection", socket => {
        console.log("Websocket connection accepted", socket.id);
        clients[socket.id] = socket;
        socket.on("disconnect", reason => {
            console.log("Websocket connection closed", socket.id, reason);
            presentWindow().webContents.send("observer-disconnect", socket.id);
        });
        socket.on("offer", offer => {
            // console.log("Got offer:", offer);
            presentWindow().webContents.send("present-offer", socket.id, offer);
        });
        socket.on("answer", answer => {
            // console.log("Got answer:", answer);
            presentWindow().webContents.send("present-answer", socket.id, answer);
        });
        socket.on("icecandidate", candidate => {
            // console.log("Got candidate:", candidate);
            presentWindow().webContents.send("present-icecandidate", socket.id, candidate);
        });
        socket.on("request-sources", () => {
            socket.emit("response-sources", getViews().filter(view => view.id != "black").map(({name, id}) => {
                return {name, uuid: id};
            }));
            presentWindow().webContents.send("present-new-user", socket.id);
        });
        socket.on("change-source", (uuid: string) => {
            presentWindow().webContents.send("observer-change-source", socket.id, uuid);
        });
    });
    ipcMain.on("present-offer", (event, id: string, offer: RTCSessionDescriptionInit) => {
        if (!clients[id]) return;
        clients[id].emit("offer", offer);
    });
    ipcMain.on("present-answer", (event, id: string, answer: RTCSessionDescriptionInit) => {
        if (!clients[id]) return;
        clients[id].emit("answer", answer);
    });
    ipcMain.on("present-icecandidate", (event, id: string, candidate: RTCIceCandidate) => {
        if (!clients[id]) return;
        clients[id].emit("icecandidate", candidate);
    });
    ipcMain.handle("cloudflare-tunnel-url", () => cloudflareURL);
    server.listen();

    restartCloudflared();
    console.log("Started server on port", server.address());
}

export function restartCloudflared() {
    cloudflared?.kill();
    let cloudflareBin = "cloudflared";
    if (process.platform === "win32") cloudflareBin += "-windows-" + (process.arch === "x64" ? "amd64" : "386") + ".exe";
    else if (process.platform === "linux") cloudflareBin += "-linux-" + process.arch;
    cloudflared = child_process.spawn(cloudflareBin, ["tunnel", "--url", `http://localhost:${(server.address() as AddressInfo).port}`], {
        env: {PATH: path.resolve(getBinPath()) + path.delimiter + process.env.PATH}
    });
    cloudflared.stderr.on("data", data => {
        const match = data.toString().match(/ (https:\/\/.+?\.trycloudflare\.com) /);
        if (!match) return;
        cloudflareURL = match[1];
        console.log("Your tunnel is ready at", match[1]);
    });
}

export function stopServer() {
    server?.close();
    cloudflared?.kill();
    console.log("Stopped server");
}

export function newSource(uuid: string, name: string) {
    ioServer.emit("new-source", uuid, name);
}

export function renameSource(uuid: string, name: string) {
    ioServer.emit("rename-source", uuid, name);
}

export function removeSource(uuid: string) {
    ioServer.emit("remove-source", uuid);
}

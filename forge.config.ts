import type {ForgeConfig, ResolvedForgeConfig} from "@electron-forge/shared-types";
import {MakerSquirrel} from "@electron-forge/maker-squirrel";
import {MakerZIP} from "@electron-forge/maker-zip";
import {MakerDeb} from "@electron-forge/maker-deb";
import {MakerRpm} from "@electron-forge/maker-rpm";
import {MakerDMG} from "@electron-forge/maker-dmg";
import {AutoUnpackNativesPlugin} from "@electron-forge/plugin-auto-unpack-natives";
import {WebpackPlugin} from "@electron-forge/plugin-webpack";
import {FusesPlugin} from "@electron-forge/plugin-fuses";
import {FuseV1Options, FuseVersion} from "@electron/fuses";

import {mainConfig} from "./webpack.main.config";
import {rendererConfig} from "./webpack.renderer.config";
import PortableMaker from "./src/PortableMaker";
import {execSync} from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import {Readable} from "node:stream";
import {finished} from "node:stream/promises";
import {ReadableStream} from "node:stream/web";
import * as zlib from "node:zlib";
import * as tar from "tar";

const config: ForgeConfig = {
    packagerConfig: {
        name: "AIESEC HK Projector",
        asar: true,
        icon: "./src/assets/Icon",
        appCategoryType: "public.app-category.developer-tools",
        extraResource: [
            "./bin"
        ]
    },
    rebuildConfig: {},
    makers: [new MakerSquirrel({setupIcon: "./src/assets/Icon.ico"}), new PortableMaker(), new MakerZIP(), new MakerDMG(), new MakerRpm(), new MakerDeb()],
    plugins: [
        new AutoUnpackNativesPlugin({}),
        new WebpackPlugin({
            mainConfig,
            // default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:
            // devContentSecurityPolicy: "default-src 'self' data: 'unsafe-inline'; script-src 'self' data: 'unsafe-inline' 'unsafe-eval'; script-src-elem 'self' https://cdn.tailwindcss.com 'sha256-F2Bg2XDzKIHKH8qssVhrt6ggqvaZhUppPBJw7p8cyXM='; style-src 'self' data: 'unsafe-inline' https://rsms.me/inter/inter.css; font-src https://rsms.me/inter/font-files/",
            renderer: {
                config: rendererConfig,
                entryPoints: [
                    {
                        html: "./src/windows/main/index.html",
                        js: "./src/windows/main/renderer.ts",
                        name: "main_window",
                        preload: {
                            js: "./src/windows/main/preload.ts",
                        },
                    }, {
                        html: "./src/windows/present/present.html",
                        js: "./src/windows/present/renderer.ts",
                        name: "present_window",
                        preload: {
                            js: "./src/windows/present/preload.ts",
                        },
                    }, {
                        html: "./src/windows/sharescreen/sharescreen.html",
                        js: "./src/windows/sharescreen/renderer.ts",
                        name: "share_screen_window",
                        preload: {
                            js: "./src/windows/sharescreen/preload.ts",
                        },
                    }, {
                        html: "./src/windows/pdf/pdf.html",
                        js: "./src/windows/pdf/renderer.ts",
                        name: "pdf_window",
                        preload: {
                            js: "./src/windows/pdf/preload.ts",
                        },
                    }, {
                        name: "viewer_window",
                        preload: {
                            js: "./src/integrations/preload.ts",
                        }
                    }, {
                        name: "canva_window",
                        preload: {
                            js: "./src/integrations/canva.ts",
                        }
                    }, {
                        name: "observer_window",
                        html: "./src/windows/observer/index.html",
                        js: "./src/windows/observer/renderer.ts",
                        preload: {
                            js: "./src/windows/observer/preload.ts",
                        }
                    }
                ],
            },
        }),
        // Fuses are used to enable/disable various Electron functionality
        // at package time, before code signing the application
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
        }),
    ],
    hooks: {
        preStart: async config => {
            console.log("Starting preStart hook")
            await pre(config)
            console.log("Finished preStart hook")
        },
        postStart: async config => {
            console.log("Starting postStart hook")
            await post("start", config)
            console.log("Finished postStart hook")
        },
        prePackage: async config => {
            console.log("Starting prePackage hook")
            await pre(config)
            console.log("Finished prePackage hook")
        },
        postPackage: async config => {
            console.log("Starting postPackage hook")
            await post("package", config)
            console.log("Finished postPackage hook")
        },
    }
};

async function pre(config: ResolvedForgeConfig) {
    const sharescreen = path.resolve(__dirname, "src", "windows", "sharescreen");
    const bin = path.resolve(__dirname, "bin");
    if (!fs.existsSync(bin)) fs.mkdirSync(bin);
    if (process.platform === "darwin") {
        if (!fs.existsSync(path.resolve(bin, "screens")))
            if (execSync("swiftc --version").includes("Apple Swift version")) {
                execSync(`swiftc ${sharescreen}/screens.swift -target x86_64-apple-macos11 -o bin/screens_x86-64`);
                execSync(`swiftc ${sharescreen}/screens.swift -target arm64-apple-macos11 -o bin/screens_arm64`);
                execSync("lipo -create bin/screens_x86-64 bin/screens_arm64 -output bin/screens");
                fs.rmSync(path.resolve(__dirname, "bin", "screens_x86-64"));
                fs.rmSync(path.resolve(__dirname, "bin", "screens_arm64"));
            }
    }
}

async function post(name: "start" | "package", config: ResolvedForgeConfig) {
    const sharescreen = path.resolve(__dirname, "src", "windows", "sharescreen");
    if (process.platform === "darwin") {
        const src = path.resolve(sharescreen, "shortcut.swift");
        const dst = path.resolve(__dirname, "bin", "shortcut.swift");
        if (!fs.existsSync(dst)) fs.copyFileSync(src, dst);
    } else if (process.platform === "win32") {
        const src = path.resolve(sharescreen, "shortcut.exe");
        const dst = path.resolve(__dirname, "bin", "shortcut.exe");
        if (!fs.existsSync(dst)) fs.copyFileSync(src, dst);
    }

    if (name === "start") {
        const paths = process.env.PATH.split(path.delimiter);

        if (paths.map(p => fs.existsSync(p) ? fs.readdirSync(p).filter(file => file.includes("cloudflared")) : []).flat().length === 0 &&
            fs.readdirSync(path.resolve(__dirname, "bin")).filter(file => file.includes("cloudflared")).length === 0)
            await downloadCloudflared();
    } else if (name === "package") {
        if (fs.readdirSync(path.resolve(__dirname, "bin")).filter(file => file.includes("cloudflared")).length === 0 || process.platform === "win32")
            await downloadCloudflared();
    }
}

async function downloadCloudflared() {
    console.log("Downloading cloudflared...");
    let headers: Record<string, string> = {"Content-Type": "application/json"};
    if (process.env.GITHUB_TOKEN) {
        headers = {
            ...headers,
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        };
    }
    const res = await fetch("https://api.github.com/repos/cloudflare/cloudflared/releases/latest", {headers}).then(res => res.json())
    const dest = path.resolve(__dirname, "bin");
    if (process.platform === "darwin") {
        const assets = res.assets.filter((asset: any) => asset.name.includes("darwin"));
        if (assets.length === 0) return;
        await Promise.all(assets.map(async (asset: any) => {
            const response = await fetch(asset.browser_download_url);
            await finished(Readable.fromWeb(response.body as ReadableStream<any>).pipe(zlib.createUnzip()).pipe(tar.extract({
                cwd: dest, onReadEntry: entry => {
                    entry.path = asset.name.split(".")[0];
                    return entry;
                }
            })))
        }))
        execSync(`lipo -create ${assets.map((asset: any) => asset.name.split(".")[0]).join(" ")} -output cloudflared`, {cwd: dest});
        assets.forEach((asset: any) => fs.rmSync(path.resolve(dest, asset.name.split(".")[0])));
    } else if (process.platform === "win32") {
        for (let bin of fs.readdirSync(dest).filter(f => f.includes("cloudflared"))) {
            fs.rmSync(path.resolve(dest, bin));
        }
        const assets = res.assets.filter((asset: any) => asset.name.includes("windows") && asset.name.includes(".exe"));
        if (assets.length === 0) return;
        await Promise.all(assets.map(async (asset: any) => {
            const response = await fetch(asset.browser_download_url);
            await finished(Readable.fromWeb(response.body as ReadableStream<any>).pipe(fs.createWriteStream(path.resolve(dest, asset.name))));
        }));
    } else if (process.platform === "linux") {
        const assets = res.assets.filter((asset: any) => asset.name.includes("linux") && !asset.name.includes("."));
        if (assets.length === 0) return;
        await Promise.all(assets.map(async (asset: any) => {
            const response = await fetch(asset.browser_download_url);
            await finished(Readable.fromWeb(response.body as ReadableStream<any>).pipe(fs.createWriteStream(path.resolve(dest, asset.name))));
        }));
    }
    console.log("Finished downloading cloudflared");
}

export default config;

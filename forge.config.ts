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

const config: ForgeConfig = {
    packagerConfig: {
        name: "AIESEC HK Projector",
        appBundleId: "tk.sunnylo.aiesec.projector",
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
            devContentSecurityPolicy: "default-src * 'self' data: 'unsafe-inline' 'unsafe-hashes' 'unsafe-eval'",
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
                        // js: "./src/integrations/renderer.ts",
                        preload: {
                            js: "./src/integrations/preload.ts",
                        }
                    }, {
                        name: "canva_window",
                        preload: {
                            js: "./src/integrations/canva.ts",
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
            console.log("Starting preStart hook");
            await pre(config);
            console.log("Finished preStart hook");
        },
        postStart: async config => {
            console.log("Starting postStart hook");
            await post("start", config);
            console.log("Finished postStart hook");
        },
        prePackage: async config => {
            console.log("Starting prePackage hook");
            await pre(config);
            console.log("Finished prePackage hook");
        },
        postPackage: async config => {
            console.log("Starting postPackage hook");
            await post("package", config);
            console.log("Finished postPackage hook");
        },
    }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
}

export default config;

import MakerBase, {MakerOptions} from "@electron-forge/maker-base";
import {ForgePlatform} from "@electron-forge/shared-types";
import {buildForge, Configuration} from "app-builder-lib";

export default class PortableMaker extends MakerBase<Configuration> {
    name = "portable";
    defaultPlatforms: ForgePlatform[] = ["win32"];

    isSupportedOnCurrentPlatform() {
        return true;
    }

    async make(options: MakerOptions) {
        if (options.targetPlatform !== "win32") {
            throw new Error("Portable apps can only target the 'win32' platform");
        }

        return buildForge(options, {
            win: [`portable:${options.targetArch}`]
        });
    }
}

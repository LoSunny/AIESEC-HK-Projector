import type {Configuration} from "webpack";

import {rules} from "./webpack.rules";
import {plugins} from "./webpack.plugins";
import CopyWebpackPlugin from "copy-webpack-plugin";

export const mainConfig: Configuration = {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    entry: "./src/index.ts",
    // Put your normal webpack config below here
    module: {
        rules,
    },
    plugins: [
        ...plugins,
        new CopyWebpackPlugin({
            patterns: [{from: "src/windows/observer/index.html", to: "observer.html"}]
        }),
    ],
    resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
    },
    externals: ["nock", "mock-aws-s3", "aws-sdk", "bufferutil", "utf-8-validate"]
};

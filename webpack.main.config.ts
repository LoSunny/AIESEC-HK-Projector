import type {Configuration} from "webpack";

import {rules} from "./webpack.rules";
import {plugins} from "./webpack.plugins";
import TerserPlugin from "terser-webpack-plugin";

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
    ],
    resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
    },
    externals: ["nock", "mock-aws-s3", "aws-sdk", "bufferutil", "utf-8-validate"],
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    },
};

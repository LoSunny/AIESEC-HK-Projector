import type {Configuration} from "webpack";

import {rules} from "./webpack.rules";
import {plugins} from "./webpack.plugins";
import CopyWebpackPlugin from "copy-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";

// The first two shared rules relocate native Node modules for the main process.
// Applying them to a browser renderer emits a runtime `__dirname` reference,
// which is unavailable in Electron's sandboxed renderer.
const rendererRules = rules.slice(2);

rendererRules.push({
    test: /\.css$/,
    use: [{loader: "style-loader"}, {loader: "css-loader"}, {loader: "postcss-loader"}],
});

export const rendererConfig: Configuration = {
    module: {
        rules: rendererRules,
    },
    plugins: [
        ...plugins,
        new CopyWebpackPlugin({
            patterns: [
                {from: "node_modules/pdfjs-dist/build/pdf.worker.mjs", to: "pdf.worker.mjs"},
                {from: "src/assets/icons", to: "icons"}
            ]
        })
    ],
    resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".svg"],
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    },
};

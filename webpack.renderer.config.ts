import type {Configuration} from "webpack";

import {rules} from "./webpack.rules";
import {plugins} from "./webpack.plugins";
// eslint-disable-next-line import/default
import CopyWebpackPlugin from "copy-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";

rules.push({
    test: /\.css$/,
    use: [{loader: "style-loader"}, {loader: "css-loader"}, {loader: "postcss-loader"}],
});

export const rendererConfig: Configuration = {
    module: {
        rules,
    },
    plugins: [
        ...plugins,
        new CopyWebpackPlugin({
            patterns: [{from: "node_modules/pdfjs-dist/build/pdf.worker.mjs", to: "pdf.worker.mjs"}]
        })
    ],
    resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    },
};

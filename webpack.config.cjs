const { resolve } = require("path")
const jsonLoader = require("./loaders/json.cjs")
const HtmlPlugin = require("./plugins/htmlPlugin.cjs")
module.exports = {
    entry: "./src/main.js",
    output: {
        path: resolve(__dirname, "dist"),
        filename: "bundle.js"
    },
    moudle: {
        rules: [
            {
                test: /\.json$/,
                use: [
                    jsonLoader
                ]
            }
        ]
    },
    plugins: [
        new HtmlPlugin({
            template: "index.html",
            title: "mini-webpack"
        })
    ]
}
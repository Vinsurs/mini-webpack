import fs from "fs-extra"
import path from "path"
import { fileURLToPath } from "node:url"
import config from "../webpack.config.cjs"
import * as parser from "@babel/parser"
import _traverse from "@babel/traverse"
import { transformFromAstSync } from "@babel/core"
import ejs from "ejs"
import { SyncHook } from "tapable"

const traverse = _traverse.default
const cwd = process.cwd()
const __dirname = path.resolve(fileURLToPath(import.meta.url), "..")
const hooks = {
    afterBuild: new SyncHook(["builtOutput"])
}
let id = 0
/**
 * fs.readFileSync wrap
 * @param {string} filePath 
 * @returns string
 */
function readFileSync(filePath) {
    return fs.readFileSync(filePath, "utf8")
}
/**
 * @param {string} filePath 
 * @returns {{id: number; filePath: string; code: string; deps: Array<string>; mapping: {[filePath: string]: number;}}}
 */
function createAsset(filePath) {
    let source = readFileSync(filePath)
    // handle loaders
    if (config.moudle && config.moudle.rules) {
        for (const rule of config.moudle.rules) {
            if (rule.test && rule.test.test(filePath)) {
                for (const loader of rule.use) {
                    source = loader(source)
                }
            }
        }
    }
    const deps = []
    const ast = parser.parse(source, {
        sourceType: "module",
    })
    traverse(ast, {
        ImportDeclaration({ node }) {
            deps.push(node.source.value)
        },
    })
    const { code } = transformFromAstSync(ast, null, {
        presets: ["@babel/preset-env"],
    })
    return {
        id: id++,
        filePath,
        code,
        deps,
        mapping: {}
    }
}
function createGraph() {
    // apply plugins 
    if (config.plugins) {
        for (const plugin of config.plugins) {
            // register event
            plugin.apply(hooks)
        }
    }
    const mainAsset = createAsset(path.join(cwd, config.entry))
    const graph = [mainAsset]
    
    for (const asset of graph) {
        for (const dep of asset.deps) {
            const childAsset = createAsset(path.resolve(asset.filePath, "..", dep))
            asset.mapping[dep] = childAsset.id
            graph.push(childAsset)
        }
    }
    return graph
}
const graph = createGraph()
const template = readFileSync(path.resolve(__dirname, "./bundle.ejs"))
const data = graph.map(({ id, code, mapping }) => {
    return {
        id,
        code,
        mapping
    }
})
const code = ejs.render(template, {
    data
})
const outputPath = config.output.path
fs.ensureDirSync(outputPath)
fs.writeFileSync(path.resolve(outputPath, config.output.filename), code, "utf-8")
// trigger event
hooks.afterBuild.call({
    outputPath,
    scriptFilename: config.output.filename,
})

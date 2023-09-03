const { JSDOM } = require('jsdom');
const fs = require("fs-extra");
const path = require("path");
const ejs = require("ejs");
module.exports = class HtmlPlugin {
    constructor(options) {
        this.options = options || {
            template: 'index.html',
            title: 'mini-webpack',
        };
    }
    apply(hooks) {
        hooks.afterBuild.tap('HtmlPlugin#afterBuild', (builtOutput) => {
            const htmltemplate = fs.readFileSync(path.resolve(process.cwd(), this.options.template), 'utf-8');
            const code = ejs.render(htmltemplate, {
                HTMLPLUGIN: {
                    title: this.options.title,
                }
            })
            const jsdom = new JSDOM(code);
            const script = jsdom.window.document.createElement("script");
            script.src = `./${builtOutput.scriptFilename}`;
            jsdom.window.document.querySelector('body').appendChild(script);
            const html = jsdom.window.document.documentElement.outerHTML;
            fs.writeFileSync(path.resolve(builtOutput.outputPath, this.options.template), html, "utf8");
        });
    }
}
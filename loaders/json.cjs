/**
 * handle json file
 * @param {string} source source code to be handled
 * @returns {string}
 */
module.exports = function(source) {
    return `export default ${source}`
}
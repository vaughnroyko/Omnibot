var typego = require("typego");
module.exports = {
    Database: typego.Database,
    Document: typego.Document,
    Collection: typego.Collection,
    Query: typego.Query,
    Ranks: require("../out/core/Ranks.js"),
    Plugin: require("../out/core/Plugins.js").Plugin,
}
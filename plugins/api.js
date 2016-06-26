var typego = require("typego");
module.exports = {
    Database: typego.Database,
    Chat: require("../out/core/Chat.js").Chat,
    Document: typego.Document,
    Collection: typego.Collection,
    Query: typego.Query,
    Ranks: require("../out/core/Ranks.js"),
    Plugin: require("../out/core/Plugins.js").Plugin,
}
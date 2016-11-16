var typego = require("typego");
module.exports = {
    Database: typego.Database,
    Document: typego.Document,
    Collection: typego.Collection,
    Query: typego.Query,
    Chat: require("../out/core/Chat.js").Chat,
    Ranks: require("../out/core/Ranks.js"),
    Plugin: require("../out/core/Plugins.js").Plugin,
}
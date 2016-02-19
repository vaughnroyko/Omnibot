var database = require("./database.js");

var chatters = module.exports = function (bot) {
    bot.client.on("join", function () {
        console.log("join", arguments);
    });
    bot.client.on("part", function () {
        console.log("part", arguments);
    });
    bot.client.on("chat", function () {
        console.log("chat", arguments);
    });
};
var season = require("season");

module.exports = function (bot) {
    var identity = bot.identity, channel = bot.channel;

    var chatters = bot.database.addTable({
        name: String,
        displayName: String,
        rank: Number,
        chatting: Boolean,
        firstJoin: Number,
        time: Number
    });

    var ranks = season.readFileSync("./lib/core/ranks.cson");

    var chatter = function (name, rank) {
        this.name = name.toLowerCase();
        this.rank = rank in ranks ? ranks[rank] : typeof rank == "number" ? rank : ranks.new;


    };

    chatter.prototype = {
        save: function () {

        }
    };

    var api = {
        ranks: ranks,
        get: function (data) {
            var result;
            if (typeof data == "object") {
                if (data.constructor.name == "chatter") result = data;
                else result = new chatter(data.name || data["display-name"], data.mod ? 2 : 0);
            }
            if (typeof data == "string") result = new chatter(data, ranks.new);
            if (result) {
                if (result.name == identity) result.rank = ranks.bot;
                else if (result.name == channel) result.rank = ranks.channel;
                if (typeof data == "object" && "display-name" in data) result.displayName = data["display-name"];
                result.save();
                return result;
            }
        },
        join: function (ch) {
            console.log(ch);
            ch = api.get(ch);
            console.log(ch);
        },
        part: function () {

        },
        list: function () {

        }
    }

    bot.client.on("join", api.join.bind(api));
    bot.client.on("chat", api.join.bind(api));
    bot.client.on("part", api.part.bind(api));

    return api;
};
var season = require("season");

module.exports = function (bot) {
    var identity = bot.identity, channel = bot.channel;

    var chatters = bot.database.table("chatters", {
        name: String,
        displayName: String,
        rank: Number,
        chatting: Boolean,
        firstJoin: Number,
        time: Number
    });

    var ranks = season.readFileSync("./lib/core/ranks.cson");

    var chatter = function (name, rank) {
        if (typeof name == "object" && name.constructor.name == "model") {
            this.stored = name;
        } else {
            this.name = name.toLowerCase(), this.displayName = this.name;
            this.rank = rank in ranks ? ranks[rank] : typeof rank == "number" ? rank : ranks.new;

            this.stored = chatters.where({name: this.name}).findSync(1);
        }
        if (this.stored) {
            this.name = this.stored.name,
            this.displayName = this.stored.displayName,
            this.rank = this.stored.rank,
            this.chatting = this.stored.chatting,
            this.time = this.stored.time;
        } else {
            this.stored = new chatters.row({
                name: this.name,
                displayName: this.name,
                rank: this.rank,
                chatting: true,
                firstJoin: Date.now() / 1000 | 0,
                time: 0
            });
            this.stored.saveSync();
        }
    };

    chatter.prototype = {
        save: function () {
            this.stored.name = this.name,
            this.stored.displayName = this.displayName,
            this.stored.rank = this.rank,
            this.stored.chatting = this.chatting,
            this.stored.time = this.time;
            this.stored.saveSync();
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
        join: function (chtr) {
            chtr = api.get(chtr);
            chtr.chatting = true;
            chtr.save();
        },
        part: function (chtr) {
            chtr = api.get(chtr);
            chtr.chatting = false;
            chtr.save();
        },
        list: function () {
            var chs = chatters.where({chatting: true}).findSync(), result = [];
            for (var i = 0; i < chs.length; i++) {
                result.push(new chatter(chs[i]));
            }
            return result;
        },
        getRank: function (rank) {
            if (typeof rank == "string" && rank in ranks) rank = ranks[rank];
            if (typeof rank != "number") return ranks.new;
            return Math.clamp(Math.floor(rank), ranks.new, ranks.bot);
        }
    }

    bot.client.on("join", api.join.bind(api));
    bot.client.on("chat", api.join.bind(api));
    bot.client.on("part", api.part.bind(api));

    return api;
};
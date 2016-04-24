var _ = require("underscore-plus");

var argr = {
    match: function (expected, given) {

    }
};

var commands = module.exports = function (bot) {

    var chatters = bot.chatters;

    var library = {
        stop: {
            rank: "admin",
            call: function () {
                bot.say("Shutting down.. Bye guys... ;-;");
                bot.stop();
            }
        },
        restart: {
            rank: "admin",
            call: function () {
                bot.say("brbz");
                bot.restart();
            }
        },
        noah: {
            call: bot.say.bind(bot, "wow")
        }
    };

    var api = {
        logger: bot.logger,
        database: bot.database
    }, logger = bot.logger;

    return {
        add: function (lib) {
            library = _.extend(lib(api), library);
        },
        call: function (command, chatter) {
            command = command.split(/\s+/);
            var args = command.slice(1), name = command[0];
            if (name in library) {
                command = library[name];
                args = "args" in command ? argr.match(library[command].args, args) : undefined;
                if ("rank" in command) {
                    var rank = command[rank];
                    if (typeof rank == "object") {
                        if (
                            ("min" in rank && chatter.rank < chatters.getRank(rank.min)) ||
                            ("max" in rank && chatter.rank > chatters.getRank(rank.max))
                        ) return false;
                    } else {
                        if (chatter.rank < chatters.getRank(rank)) return false;
                    }
                }
                command.call(args);
            }
            return false;
        }
    };
}
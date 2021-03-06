var ranks = global.data.ranks;
var util = global.util;
var options = global.options;

var chalk = global.modules.chalk;
var _ = global.modules.underscore;
var sync = global.modules.sync;

var styles = global.styles;
var viewers = global.util.viewers;

var commands = {};

var addCommands = function (newCommands) {
    _.extend(commands, newCommands);
};

addCommands({
    /*
        UPTIME - prints how long the channel has been live for
      usage: !uptime
    */
    uptime: function () {
        if (util.isLive()) {
            var started = new Date(global.bot.data.stream.created_at);
            var now = new Date();
            var uptime = now - started;
            var hours = Math.floor((uptime % 86400000) / 3600000);
            var minutes = Math.floor(((uptime % 86400000) % 3600000) / 60000);
            util.chatter.say(util.weave("bot.time", global.bot.channel, hours, minutes));
        } else {
            util.chatter.say(util.weave("bot.notLive", global.bot.channel));
        }
    },
    /*
        COMMANDS - prints a list of all commands
      usage: !commands <category>
    */
    commands: function (user, category) {

    },
    /*
        STOP - stops the bot
      usage: !stop
      limitations: user.rank >= admin
    */
    stop: function (user) {
        if (user.rank >= ranks.admin) {
            util.chatter.say(util.weave("bot.stop", global.bot.name));
            global.bot.exit();
        }
    },
    /*
        RESTART - restarts the bot
      usage: !restart
      limitations: user.rank >= admin
    */
    restart: function (user) {
        if (user.rank >= ranks.admin) {
            util.chatter.say(util.weave("bot.restart", global.bot.name));
            global.bot.exit(4);
        }
    },
    /*
        TIME - prints the total time a user has watched the stream (live)
      usage: !time <user>
    */
    time: function (user, who) {
        var self = true;
        if (who) {
            user = util.viewers.get(who);
            self = false;
        }
        if (util.viewers.isBlacklisted(user)) {
            util.chatter.say(util.weave("core.time.blacklisted",
                user, // name of user to get points of
                self, // if the user is the one who asked for the points
                user.name == global.bot.name // if the user is me
            ));
        } else {
            if (user && "time" in user) {
                util.chatter.say(util.weave("core.time.normal",
                    user,
                    self
                ));
            } else {
                util.chatter.say(util.weave("core.time.unknown",
                    user,
                    self
                ));
            }
        }
    },
    /*
        WHO IS - prints some information about a user
      usage: !whois <user>
    */
    whois: function (user, who) {
        var self = true;
        if (typeof who == "string") {
            user = util.viewers.get(who);
            self = false;
        }
        //TODO get all stats for a user
        var out = util.weave("core.whois", user, util.viewers.stats.rank(user), (function () {
            var result = "";
            for (var stat in util.viewers.stats) {
                if (stat != "rank") {
                    result += util.viewers.stats[stat](user);
                }
            }
            return result;
        })());



        util.chatter.say(out);
    },
    /*
        RANK - sets the rank of a user
      usage: !rank <user> <rank>
    */
    rank: function (user, who, rank) {
        try {
            who = viewers.get(who);
        } catch (err) {
            util.chatter.say(util.weave("core.rank.notExist", who));
            throw err;
        }
        if (user.rank >= ranks.admin && user.rank > who.rank) {
            var rankName;
            if (rank in ranks) {
                rankName = rank;
                rank = ranks[rank];
            } else {
                for (var name in ranks) {
                    if (ranks[name] == rank) {
                        rankName = name;
                    }
                }
            }
            if (rank < ranks.broadcaster) {
                viewers.update(who, {$set: {
                    rank: rank
                }});
                util.chatter.say(util.weave("core.rank.success", who, rankName));
                return;
            }
        }
        util.chatter.say(util.weave("core.rank.invalid", rank));
    }
});

if (options.core.modules.quotes.enabled) addCommands(require('./raffles.js'));
if (options.core.modules.quotes.enabled) addCommands(require('./quotes.js'));
if (options.core.modules.points.enabled) addCommands(require('./points.js'));
if (options.core.modules.customCommands.enabled) addCommands(require('./custom.js'));

module.exports = commands;

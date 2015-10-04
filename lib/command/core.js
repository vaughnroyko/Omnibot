var ranks = global.data.ranks;
var util = global.util;
var options = global.options;

var chalk = global.modules.chalk;
var _ = global.modules.underscore;
var sync = global.modules.sync;

var styles = global.styles;
var bot = global.bot;

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
            var started = new Date(bot.channelData.stream.created_at);
            var now = new Date();
            var uptime = now - started;
            var hours = Math.floor((uptime % 86400000) / 3600000);
            var minutes = Math.floor(((uptime % 86400000) % 3600000) / 60000);
            util.chatter.say(options.output.streamTime.weave(bot.channel, hours, minutes));
        } else {
            util.chatter.say(options.output.notLive.weave(bot.channel));
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
      limitations: broadcaster || (moderator && modsCanRunBroadcasterCommands [defaults to true in core.cson])
    */
    stop: function (user) {
        if (user.rank >= ranks.admin) {
            util.chatter.say(options.output.stopTheBot);
            util.chatter.log(null, styles.console.info(user.name + " stopped the bot!"));
            bot.exit();
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
            util.chatter.say(options.output.core.time.blacklisted.weave(
                user.name, // name of user to get points of
                self, // if the user is the one who asked for the points
                user.name == options.twitch.identity.username // if the user is me
            ));
        } else {
            if (user && "time" in user) {
                util.chatter.say(options.output.core.time.normal.weave(
                    user.name,
                    user.time,
                    self
                ));
            } else {
                util.chatter.say(options.output.core.time.unknown.weave(
                    user.name,
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
        var out = user.name + " [" + util.viewers.stats.rank(user) + "]: ";

        for (var stat in util.viewers.stats) {
            if (stat != "rank") {
                out += util.viewers.stats[stat](user);
            }
        }

        util.chatter.say(out);
    },
    /*
        RANK - sets the rank of a user
      usage: !rank <user> <rank>
    */
    rank: function (user, who, rank) {
        try {
            who = global.util.viewers.getUser(who);
        } catch (err) {
            util.chatter.log(null, "Couldn't find the user '" + who.name + "'...");
            throw err;
        }
        if (rank in ranks) rank = ranks[rank];
        for (var name in ranks) if (ranks[name] == rank && rank < ranks.broadcaster) {
            if (user.rank >= ranks.admin && user.rank > who.rank) {
                 who.update({$set: {
                     rank: rank
                 }});
            }
            return;
        }
        util.chatter.log(null, "That isn't a valid rank.")
    }
});

//if (options.core.quotes.enabled) addCommands(module.exports, require('./quotes.js'));
if (options.core.modules.points.enabled) addCommands(require('./points.js'));
if (options.core.modules.customCommands.enabled) addCommands(require('./custom.js'));

module.exports = commands;
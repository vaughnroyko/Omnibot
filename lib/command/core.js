var ranks = global.data.ranks;
var util = global.util;
var options = global.options;

var chalk = global.modules.chalk;
var _ = global.modules.underscorePlus;

var styles = global.styles;
var bot = global.bot;

var commands = {};

var addCommands = function (newCommands) {
    _.extend(commands, newCommands);
};

addCommands({
    /*
      usage: !uptime
    */
    uptime: function () {
        if (util.isLive()) {
            var started = new Date(bot.apiData[channel].stream.created_at);
            var now = new Date();
            var uptime = now - started;
            var hours = Math.floor((uptime % 86400000) / 3600000);
            var minutes = Math.floor(((uptime % 86400000) % 3600000) / 60000);
            util.chatter.say(options.output.streamTime.format(bot.channel, hours, minutes));
        } else {
            util.chatter.say(options.output.notLive.format(bot.channel));
        }
    },
    /*
      usage: !commands <category>
    */
    commands: function (user, category) {

    },
    /*
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
      usage: !time <user>
    */
    time: function (user, who) {
        var self = true;
        if (typeof who == "string") {
            user = {name: who.toLowerCase(), rank: global.bot.users[who.toLowerCase()]};
            self = false;
        }
        if (user.rank == ranks.broadcaster || user.name == global.options.twitch.identity.username) {
            util.chatter.say((self? "Your" : (user.name == options.twitch.identity.username ? "My own": user.name + "'s")) + " amount of time logged exceeds the limits of my computational power" + (self? ", " + user.name : "") + ".");
        } else {
            global.database.users.findOne({username: user.name}, function(err, docs) {
                if (docs) {
                    util.chatter.say((self? "You have " : user.name + " has ") + docs.time + " minutes logged" + (self? ", " + user.name : "") + "!");
                } else {
                    util.chatter.say("Wait, who " + (self? "are you" : "is " + user.name) + " again" + (self? ", " + user.name : "") + "?");
                }
            });
        }
    },
    /*
      usage: !whois <user>
    */
    whois: function (user, who) {
        var self = true;
        if (typeof who == "string") {
            user = {name: who.toLowerCase(), rank: global.bot.users[who.toLowerCase()]};
            self = false;
        }
        //TODO get all stats for a user
        util.chatter.say(user.name + " [" + (function() {
            for (var rank in ranks) {
                if (ranks[rank] == user.rank) return rank;
            }
            return "unknown (" + user.rank + ")";
        })() + "]: ");
    }
});

//if (options.core.quotes.enabled) addCommands(module.exports, require('./quotes.js'));
if (options.core.modules.points.enabled) addCommands(require('./points.js'));
if (options.core.modules.customCommands.enabled) addCommands(require('./custom.js'));

module.exports = commands;
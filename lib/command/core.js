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
}

addCommands({
    /*
      usage: !uptime
    */
    uptime: function (user, params) {
        if (util.isLive()) {
            var started = new Date(bot.apiData.stream.created_at);
            var now = new Date();
            var uptime = now - started;
            var hours = Math.floor((uptime % 86400000) / 3600000);
            var minutes = Math.floor(((uptime % 86400000) % 3600000) / 60000);
            util.say(options.output.streamTime.format(bot.channel, hours, minutes));
        } else {
            util.say(options.output.notLive.format(bot.channel));
        }
    },
    /*
      usage: !commands <category>
    */
    commands: function (user, params) {

    },
    /*
      usage: !stop
      limitations: broadcaster || (moderator && modsCanRunBroadcasterCommands [defaults to true in core.cson])
    */
    stop: function (user, params) {
        if (user.rank >= ranks.Broadcaster || (options.core.modsCanRunBroadcasterCommands && user.rank == ranks.Moderator)) {
            util.say(options.output.stopTheBot);
            console.log(styles.console.info(user.name + " stopped the bot!"));
            bot.exit();
        }
    }
});

//if (options.core.quotes.enabled) addCommands(module.exports, require('./quotes.js'));
if (options.core.modules.points.enabled) addCommands(require('./points.js'));
if (options.core.modules.customCommands.enabled) addCommands(require('./custom.js'));

module.exports = commands;
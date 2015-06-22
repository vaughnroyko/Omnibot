var ranks = global.data.ranks;
var util = global.util;
var options = global.options;

var chalk = global.modules.chalk;
var _ = global.modules.underscorePlus;

var styles = global.styles;

module.exports = {
    /*
      usage: !stop
      limitations: broadcaster || (moderator && modsCanRunBroadcasterCommands [defaults to true in core.cson])
    */
    stop: function (user, params) {
        if (user.rank >= ranks.Broadcaster || (options.core.modsCanRunBroadcasterCommands && user.rank == ranks.Moderator)) {
            util.say(options.output.stopTheBot);
            console.log(styles.console.info(user.name + " stopped the bot!"));
            bot.client.disconnect(); //Stop IRC
            process.exit(); //Stop node
        }
    },
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
    quote: function (user, params) {
        var params = message.split(" ");
        var author = params[1].toLowerCase();
        var quote = params.slice(2).join(" ");
        // Do something
        database.users.findOne({username: user.name, time: { $gt: 100 }}, function(err, docs) {
            //Only allow people with certain time, or me, or mode to add quotes
            if (docs || user.rank >= ranks.Moderator) {
                database.users.findOne({username: author}, function(err, docs) {
                    if (docs) {
                        var now = new Date();
                        //TODO doesn"t work?
                        database.quotes.insert({username: author, quote: quote, added: now});
                        util.say("Quote has been added for " + author + "!");
                    } else {
                        util.say(author + " does not exist!");
                    }
                });
            }
        });
    },
    recite: function (user, params) {
        var rand = Math.floor(Math.random() * database.quotes.count());
        //TODO fix, map/toArray not working - we shouldn"t need array/map here
        database.quotes.find().limit(-1).skip(rand).next().toArray().map(function(doc) {
            util.say(doc.username + ": " + doc.quote);
        });
    }
};

if (options.core.points.enabled) {
    _.extend(module.exports, require('./points.js'));
}

if (options.core.customCommands.enabled) {
    _.extend(module.exports, require('./custom.js'));
}
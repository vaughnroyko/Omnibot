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
            util.say(options.core.output.leaving);
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
            util.say(bot.channel + " has been streaming for " + hours + " hours and " + minutes + " minutes!");
        } else {
            util.say(bot.channel + " is not live!");
        }
    },
    quote: function (user, params) {
        var params = message.split(" ");
        var author = params[1].toLowerCase();
        var quote = params.slice(2).join(" ");
        // Do something
        bot.database.users.findOne({username: user.name, time: { $gt: 100 }}, function(err, docs) {
            //Only allow people with certain time, or me, or mode to add quotes
            if (docs || user.rank >= ranks.Moderator) {
                bot.database.users.findOne({username: author}, function(err, docs) {
                    if (docs) {
                        var now = new Date();
                        //TODO doesn"t work?
                        bot.database.quotes.insert({username: author, quote: quote, added: now});
                        util.say("Quote has been added for " + author + "!");
                    } else {
                        util.say(author + " does not exist!");
                    }
                });
            }
        });
    },
    recite: function (user, params) {
        var rand = Math.floor(Math.random() * bot.database.quotes.count());
        //TODO fix, map/toArray not working - we shouldn"t need array/map here
        bot.database.quotes.find().limit(-1).skip(rand).next().toArray().map(function(doc) {
            util.say(doc.username + ": " + doc.quote);
        });
    }
};

if (options.core.points.enabled) {
    _.extend(module.exports, {
        /*
          usage: !top <count=[default, customisable in core.cson]>
        */
        top: function (user, params) {
            var count = params[0] !== undefined && params[0] > 0 ? Math.min(params[0], 10) : options.core.defaultListSize;
            global.bot.database.users.find({
                $nor: [
                    {username: global.bot.channel},
                    {username: options.twitch.identity.username}
                ]
            }).sort({points: -1}).limit(count).exec(function(err, docs) {
                var output = "Top " + count + ": ";
                if (docs) {
                    for (var i = 0; i < docs.length; i++) {
                        output += docs[i].username + ": " + docs[i].points + " | ";
                    }
                    output = output.substring(0, output.length - 3);
                    util.say(output);
                } else {
                    util.say(styles.console.error("Something went wrong."));
                }
            });
        },
        /*
          usage: !balance <username=[self]>
        */
        balance: function (user, params) {
            var self = true;
            if (params.length > 0) {
                user = {name: params[0].toLowerCase(), rank: global.bot.users[params[0].toLowerCase()]};
                self = false;
            }
            if (user.rank == ranks.Broadcaster || user.name == global.options.twitch.identity.username) {
                util.say((self? "Your" : (user.name == options.twitch.identity.username ? "My own": user.name + "'s")) + " balance exceeds the limits of my computational power" + (self? ", " + user.name : "") + ".");
            } else {
                global.bot.database.users.findOne({username: user.name}, function(err, docs) {
                    if (docs) {
                        util.say((self? "You have " : user.name + " has ") + docs.points + " points" + (self? ", " + user.name : "") + "!");
                    } else {
                        util.say("Wait, who " + (self? "are you" : "is " + user.name) + " again" + (self? ", " + user.name : "") + "?");
                    }
                });
            }
        },
        /*
          usage: !steal <[Number] || *> from <[User] || *>
          limitations: broadcaster || (moderator && modsCanRunBroadcasterCommands [defaults to true in core.cson])
        */
        steal: function (user, params) {
            if (user.rank >= ranks.Broadcaster || (options.core.modsCanRunBroadcasterCommands && user.rank == ranks.Moderator)) {
                if (params[1] == "from") {
                    var bounty = params[0];
                    if (bounty == "*") {
                        bounty = {$set: {
                            points: options.core.points.startWith
                        }};
                    } else {
                        bounty = {$inc: {
                            points: -bounty
                        }};
                    }
                    var victim = params[2];
                    if (victim == "*") victim = {};
                    else victim = {username: victim};
                    global.bot.database.users.update(
                        victim,
                        bounty,
                        { multi: true },
                        function (err, raw) {
                            console.log(raw);
                            util.say(styles.points("A robbery has occurred! A total of " + params[0] * raw.nModified + " points was stolen from " + raw.nModified + " users!"));
                        }
                    );
                }
            }
        }
    });
}
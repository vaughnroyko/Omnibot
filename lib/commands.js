var ranks = global.data.ranks;
var util = global.util;
var options = global.options;

module.exports = {
    top: function (user, params) {
        var count = params[0] !== undefined && params[0] > 0 ? Math.min(params[0], 10) : options.core.defaultListSize;
        global.bot.database.users.find().sort({points: -1}).limit(count).exec(function(err, docs) {
            var output = "Top " + count + ": ";
            if (docs) {
                for (var i = 0; i < docs.length; i++) {
                    output += docs[i].username + ": " + docs[i].points + " | ";
                }
                output = output.substring(0, output.length - 3);
                util.say(output);
            } else {
                util.say(chalk.red("Something went wrong."));
            }
        });
    },
    balance: function (user, params) {
        global.bot.database.users.findOne({username: user.name}, function(err, docs) {
            if (docs) {
                util.say('You have ' + docs.points + ' points, ' + user.name + '!');
            } else {
                util.say("Your amount of points exceeds the limits of my computational power.");
            }
        });
    },
    stop: function (user, params) {
        //Mods and broadcaster can stop the bot
        if (util.isMod(user)) {
            util.say(options.core.output.leaving);
            console.log(chalk.red(user.name + ' stopped the bot!'));
            bot.client.disconnect(); //Stop IRC
            process.exit(); //Stop node
        }
    },
    uptime: function (user, params) {
        if (util.isLive) {
            var started = new Date(bot.apiData.stream.created_at);
            var now = new Date();
            var uptime = now - started;
            var hours = Math.floor((uptime % 86400000) / 3600000);
            var minutes = Math.floor(((uptime % 86400000) % 3600000) / 60000);
            util.say(bot.channel + ' has been streaming for ' + hours + ' hours and ' + minutes + ' minutes!');
        } else {
            util.say(bot.channel + ' is not online!');
        }
    },
    quote: function (user, params) {
        var params = message.split(' ');
        var author = params[1].toLowerCase();
        var quote = params.slice(2).join(' ');
        // Do something
        bot.database.users.findOne({username: user.name, time: { $gt: 100 }}, function(err, docs) {
            //Only allow people with certain time, or me, or mode to add quotes
            if (docs || util.isMod(user)) {
                bot.database.users.findOne({username: author}, function(err, docs) {
                    if (docs) {
                        var now = new Date();
                        //TODO doesn't work?
                        bot.database.quotes.insert({username: author, quote: quote, added: now});
                        util.say('Quote has been added for ' + author + '!');
                    } else {
                        util.say(author + ' does not exist!');
                    }
                });
            }
        });
    },
    recite: function (user, params) {
        var rand = Math.floor(Math.random() * bot.database.quotes.count());
        //TODO fix, map/toArray not working - we shouldn't need array/map here
        bot.database.quotes.find().limit(-1).skip(rand).next().toArray().map(function(doc) {
            util.say(doc.username + ': ' + doc.quote);
        });
    }
};

var season = global.modules.season;
var request = global.modules.request;
var chalk = global.modules.chalk;
var api = global.modules.api;
var fs = global.modules.fs;

var ranks = global.data.ranks;
var options = global.options;
var styles = global.styles;

module.exports = {
    getTimestamp: function () {
        var now = new Date();
        return options.output.messages.timestamp.format.format(
            now.getHours().toString().padLeft(2, '0'), // hours 0-24
            (now.getHours() - 1) % 12 + 1, // hours 1-12
            now.getMinutes().toString().padLeft(2, '0'), // minutes
            now.getSeconds().toString().padLeft(2, '0'), // seconds
            now.getHours() > 11 ? options.output.messages.timestamp.pm : options.output.messages.timestamp.am // am|pm
        );
    },
    log: function (user, message) {
        if (user) {
            var timestamp = this.getTimestamp();
            message = styles.console.info(options.output.messages.format.format(timestamp, user, message));
        } else {
            message = styles.console.info(message);
        }
        fs.appendFile("bot.log", chalk.stripColor(message + "\n"));
        console.log(message);
    },
    say: function (message) {
        global.bot.client.say(global.bot.channel, chalk.stripColor(message));
        if (options.output.messages.showBotChatMessagesInConsole) {
            this.log(options.twitch.identity.username, styles.bot(message));
        }
    },
    getAPIData: function () {
        api.call({
            channel: global.bot.channel,
            method: 'GET',
            path: '/streams/' + global.bot.channel,
            options: {}
        }, function (err, statusCode, response) {
            if (err) {
                util.log(null, styles.console.error(err));
                return;
            }
            global.bot.apiData = response;
        });
    },
    isLive: function () {
        return !!bot.apiData.stream;
    },
    getViewers: function () {
        request('https://tmi.twitch.tv/group/user/' + global.bot.channel + '/chatters', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var chatters = JSON.parse(body).chatters;

                var newUsers = {};
                for (var i = 0; i < chatters.viewers.length; i++) {
                    newUsers[chatters.viewers[i]] = ranks.Viewer;
                }
                for (var i = 0; i < chatters.moderators.length; i++) {
                    newUsers[chatters.moderators[i]] = ranks.Moderator;
                }
                if (global.bot.channel in newUsers) {
                    newUsers[global.bot.channel] = ranks.Broadcaster;
                }

                // see who has arrived
                for (var user in newUsers) {
                    if (!global.bot.users[user]) {
                        global.bot.users[user] = newUsers[user];
                        if (user != global.bot.channel && user != options.twitch.identity.username) {
                            (function(user) { // fix async
                                var joinMessage = function () {
                                    util.log(null, styles.event.join(user + ' has joined!'));
                                }
                                // check if the user exists
                                global.database.users.findOne({username: user}, function(err, docs) {
                                    if (docs) {
                                        joinMessage();
                                        util.log(null, styles.points(user + ' has ' + docs.points + ' points!'));
                                    } else {
                                        var now = new Date();
                                        var newUser = new global.database.users({
                                            username: user,
                                            points: options.core.modules.points.startWith,
                                            time: 0,
                                            items: [],
                                            firstjoin: now
                                        });
                                        newUser.save(function(err, result) {
                                            joinMessage();
                                            util.log(null, styles.points('Gave ' + user + ' ' + options.core.modules.points.startWith + ' points for joining for the first time.'));
                                        });
                                    }
                                });
                            })(user);
                        }
                    }
                }

                // see who has left
                for (var user in global.bot.users) {
                    if (!newUsers[user]) {
                        util.log(null, styles.event.leave(user + ' has left!'));
                        delete global.bot.users[user];
                    }
                }
            }
        });
    }
};
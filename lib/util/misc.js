
var season = global.modules.season;
var request = global.modules.request;
var chalk = global.modules.chalk;
var api = global.modules.api;

var ranks = global.data.ranks;

var botOptions = global.options.core;

var styles = global.styles;

if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return (typeof args[number] != 'undefined'
                ? args[number]
                : match
            );
        });
    };
}

module.exports = {
    isMod: function (user) {
        return user.name === global.bot.channel.substring(1) || user.rank === ranks.Moderator;
    },
    log: function (message) {
        // use console.log, add timestamp to beginning of each string if enabled in options
    },
    say: function (message) {
        global.bot.client.say(global.bot.channel, chalk.stripColor(message));
        if (botOptions.outputBotMessagesToConsole) {
            console.log(styles.bot(global.bot.clientOptions.identity.username + ": " + message));
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
                console.log(styles.console.error(err));
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
                                    console.log(styles.event.join(user + ' has joined!'));
                                }
                                // check if the user exists
                                global.database.users.findOne({username: user}, function(err, docs) {
                                    if (docs) {
                                        joinMessage();
                                        console.log(styles.points(user + ' has ' + docs.points + ' points!'));
                                    } else {
                                        var now = new Date();
                                        var newUser = new global.database.users({
                                            username: user,
                                            points: options.core.points.startWith,
                                            time: 0,
                                            items: [],
                                            firstjoin: now
                                        });
                                        newUser.save(function(err, result) {
                                            joinMessage();
                                            console.log(styles.points('Gave ' + user + ' ' + options.core.points.startWith + ' points for joining for the first time.'));
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
                        console.log(styles.event.leave(user + ' has left!'));
                        delete global.bot.users[user];
                    }
                }
            }
        });
    }
};
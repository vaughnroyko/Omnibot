
var season = global.modules.season;
var request = global.modules.request;
var chalk = global.modules.chalk;
var api = global.modules.api;

var ranks = global.data.ranks;

var botOptions = global.options.core;

module.exports = {
    isMod: function (user) {
        return user.name === global.bot.channel.substring(1) || user.rank === ranks.Moderator;
    },
    say: function (message) {
        global.bot.client.say(global.bot.channel, message);
        if (botOptions.outputBotMessagesToConsole) console.log(chalk.yellow(global.bot.clientOptions.identity.username + ": " + message));
    },
    getAPIData: function () {
        api.call({
            channel: global.bot.channel,
            method: 'GET',
            path: '/streams/' + global.bot.channel,
            options: {}
        }, function (err, statusCode, response) {
            if (err) {
                console.log(chalk.red(err));
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

                //Get new joiners
                for (var user in newUsers) {
                    if (!global.bot.users[user]) {
                        //New join
                        global.bot.users[user] = newUsers[user];
                        console.log(chalk.cyan.bold(user + ' has joined!'));

                        //Check if the user exists
                        (function(user) { //Fix async
                            global.bot.database.users.findOne({username: user}, function(err, docs) {
                                if (docs) {
                                    console.log(chalk.green.bold(user + ' has ' + docs.points + ' points!'));
                                } else {
                                    var now = new Date();
                                    var newUser = new global.bot.database.users({username: user, points: 5, time: 0, items: [], firstjoin: now});
                                    newUser.save(function(err, result) {
                                        console.log(chalk.green.bold('Gave ' + user + ' 5 points for joining for the first time.'));
                                    });
                                }
                            });
                        })(user);
                    }
                }

                //Get new parters
                for (var user in global.bot.users) {
                    if (!newUsers[user]) {
                        console.log(chalk.grey.bold(user + ' has left!'));
                        delete global.bot.users[user];
                    }
                }
            }
        });
    }
};
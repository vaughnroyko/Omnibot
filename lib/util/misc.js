var userType = require('./userType.js');
var chalk = require('chalk');
var api = require('twitch-irc-api');
var request = require('request'); //Load http to get chatters/viewers (not apart of Twitch API)

var botOptions = require('../bot-options.js');

module.exports = {
    host: null,

    isMod: function (username) {
        return username === this.host.channel.substring(1) || this.host.users[username] === userType.Moderator;
    },

    say: function (message) {
        this.host.client.say(this.host.channel, message);
        if (botOptions.outputBotMessagesToConsole) console.log(chalk.yellow(this.host.clientOptions.identity.username + ": " + message));
    },
    getAPIData: function() {
        var t = this;
        api.call({
            channel: this.host.channel,
            method: 'GET',
            path: '/streams/' + this.host.channel,
            options: {}
        }, function(err, statusCode, response) {
            if (err) {
                console.log(chalk.red(err));
                return;
            }
            t.host.apiData = response;
        });
    },
    getViewers: function() {
        var t = this;
        request('https://tmi.twitch.tv/group/user/' + this.host.channel + '/chatters', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var chatters = JSON.parse(body).chatters;

                var newUsers = {};
                for (var i = 0; i < chatters.viewers.length; i++) {
                    newUsers[chatters.viewers[i]] = userType.Viewer;
                }
                for (var i = 0; i < chatters.moderators.length; i++) {
                    newUsers[chatters.moderators[i]] = userType.Moderator;
                }

                //Get new joiners
                for (var user in newUsers) {
                    if (!t.host.users[user]) {
                        //New join
                        t.host.users[user] = newUsers[user];
                        console.log(chalk.cyan.bold(user + ' has joined!'));

                        //Check if the user exists
                        (function(user) { //Fix async
                            t.host.database.users.findOne({username: user}, function(err, docs) {
                                if (docs) {
                                    console.log(chalk.green.bold(user + ' has ' + docs.points + ' points!'));
                                } else {
                                    var now = new Date();
                                    var newUser = new t.host.database.users({username: user, points: 5, time: 0, items: [], firstjoin: now});
                                    newUser.save(function(err, result) {
                                        console.log(chalk.green.bold('Gave ' + user + ' 5 points for joining for the first time.'));
                                    });
                                }
                            });
                        })(user);
                    }
                }

                //Get new parters
                for (var user in t.host.users) {
                    if (!newUsers[user]) {
                        console.log(chalk.grey.bold(user + ' has left!'));
                        delete t.host.users[user];
                    }
                }
            }
        });
    }
};
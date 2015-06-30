
var request = global.modules.request;
var util = global.util;

var ranks = global.data.ranks;
var options = global.options;
var styles = global.styles;

var viewerHandler = {
    updateUser: function (name, callback, extra) {
        var user;
        if (extra) {
            user = {name: name, rank: callback};
            callback = extra;
        } else {
            user = {name: name, rank: global.bot.users[name]};
        }
        global.database.users.findOne({username: name}, function(err, doc) {
            if (doc) {
                var savedRank = doc.rank;
                var ircRank = user.rank;
                if (typeof savedRank == "number" && savedRank >= 0) {
                    if (ircRank < savedRank || ircRank > Math.floor(savedRank / 2) * 2) {
                        // TODO cleanup
                    } else {
                        if (savedRank == ranks.new && doc.time >= options.core.userTrustTime) {
                            savedRank = ranks.viewer;
                            util.chatter.log(options.output.trust.format(user.name));
                        }
                        user.rank = savedRank;
                    }
                }
                doc.update({$set: {rank: user.rank}}, {}, function (err, result) {
                    // TODO fail
                });
                if (user.name in global.bot.users) global.bot.users[user.name] = user.rank;
            }
            callback(user);
        });
    },
    update: function () {
        request('https://tmi.twitch.tv/group/user/' + global.bot.channel + '/chatters', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var chatters = JSON.parse(body).chatters;

                var newUsers = {};
                for (var i = 0; i < chatters.viewers.length; i++) {
                    newUsers[chatters.viewers[i]] = ranks.new;
                }
                for (var i = 0; i < chatters.moderators.length; i++) {
                    newUsers[chatters.moderators[i]] = ranks.mod;
                }

                for (var user in newUsers) {
                    if (!(user in global.bot.users)) {
                        viewerHandler.join(user);
                    } else {
                        viewerHandler.updateUser(user, newUsers[user], function (user) {});
                    }
                }

                for (var user in global.bot.users) {
                    // and for any user that was here and isn't anymore...
                    if (!(user in newUsers)) viewerHandler.part(user);
                }
            }
        });
    },
    join: function (user, rank, callback) {
        if (!(user in global.bot.users)) {
            var skip = false;
            if (user == global.bot.channel)
                rank = ranks.broadcaster, skip = true;
            if (user == options.twitch.identity.username)
                rank = ranks.bot, skip = true;
            if (skip) {
                if (callback) callback({name: user, rank: rank});
            } else {
                global.bot.users[user] = rank;
                viewerHandler.updateUser(user, function (user) {
                    var joinMessage = function () {
                        util.chatter.log(null, styles.event.join(user.name + ' has joined!'));
                    };
                    // check if the user exists
                    global.database.users.findOne({username: user.name}, function(err, doc) {
                        if (doc) {
                            joinMessage();
                            util.chatter.log(null, styles.points(user.name + ' has ' + doc.points + ' points!'));
                            if (callback) callback(user);
                        } else {
                            var now = new Date();
                            var newUser = new global.database.users({
                                username: user.name,
                                points: options.core.modules.points.startWith,
                                time: 0,
                                items: [],
                                firstjoin: now,
                                rank: user.rank
                            });
                            newUser.save(function(err, result) {
                                joinMessage();
                                util.chatter.log(null, styles.points('Gave ' + user.name + ' ' + options.core.modules.points.startWith + ' points for joining for the first time.'));
                                if (callback) callback(user);
                            });
                        }
                    });
                });
            }
        }
    },
    part: function (user) {
        if (user != global.bot.channel && user != options.twitch.identity.username) {
            util.chatter.log(null, styles.event.leave(user + ' has left!'));
            delete global.bot.users[user];
        }
    }
};

module.exports = viewerHandler;
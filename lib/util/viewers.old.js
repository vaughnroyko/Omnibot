
var request = global.modules.request;
var sync = global.modules.sync;
var util = global.util;
var database = global.database;

var ranks = global.data.ranks;
var options = global.options;
var styles = global.styles;

var run = function (callbacks, args) {
    for (var key in callbacks) {
        if (typeof callbacks[key] == "function") {
            callbacks[key].apply(null, args);
        }
    }
};

var joinPadding = {};

var viewerHandler = {
    getUser: function (username) {
        var user = sync.wait(database.users.findOne({name: username}), 'exec', [sync.defer('user')]);
        user = (user && 'user' in user && user.user)? user.user : {name: username, rank: (
            username == global.bot.channel ? ranks.broadcaster : (
                username == global.options.twitch.identity ? ranks.bot : null
            )
        )};
        if (user.rank == null) user = undefined;
        return user;
    },
    updateUser: function (user, data) {
        var result = this.getUser(user.name);
        if (result) {
            user = result;
            var update = {};
            var savedRank = user.rank;
            var ircRank = data.rank;
            if (typeof ircRank == "number") {
                if (typeof savedRank == "number" && savedRank >= 0) {
                    if (ircRank < savedRank || ircRank > Math.floor(savedRank / 2) * 2) {
                        // TODO cleanup
                    } else {
                        if (savedRank == ranks.new && user.time >= options.core.userTrustTime) {
                            savedRank = ranks.viewer;
                            util.chatter.log(null, options.output.trustUser.weaveStrict(user.name));
                        }
                        update.rank = savedRank;
                    }
                } else update.rank = ircRank;
            }
            if (update) {
                try {
                    var result = sync.wait(user.update({$set: update}, {}), 'exec', [sync.defer('result')]).result;
                } catch (err) {
                    util.chatter.log(null, "something went wrong? " + err);
                }
            }
        }
        return user;
    },
    update: function () {
        for (var username in joinPadding) {
            if (--joinPadding[username] == 0) {
                delete joinPadding[username];
            }
        }
        request('https://tmi.twitch.tv/group/user/' + global.bot.channel + '/chatters', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var twitchList = JSON.parse(body).chatters;

                var chatters = {};
                for (var i = 0; i < twitchList.viewers.length; i++) {
                    chatters[twitchList.viewers[i]] = ranks.new;
                }
                for (var i = 0; i < twitchList.moderators.length; i++) {
                    chatters[twitchList.moderators[i]] = ranks.mod;
                }

                for (var username in chatters) {
                    var u = viewerHandler.getUser(username);
                    if (!u || !u.chatting) {
                        viewerHandler.join({name: username, rank: chatters[username]});
                    } else {
                        viewerHandler.updateUser(username, {rank: chatters[username]});
                    }
                }
                var oldChatters = sync.wait(database.users.find({chatting: true}), 'exec', [sync.defer('users')]).users;
                for (var i = 0; i < oldChatters.length; i++) {
                    var username = oldChatters[i].name;
                    // and for any user that was here and isn't anymore...
                    if (!(username in chatters || username in joinPadding)) viewerHandler.part(username);
                }
            }
        });
    },
    join: function (user) {
        if (options.core.blacklist.indexOf(user.name) < 0) {
            viewerHandler.create({name: user.name, rank: user.rank});
            joinPadding[user.name] = 2;
            var existing = viewerHandler.getUser(user.name);
            if (!existing) {
            }
            user = existing;
            if (!user.chatting) {
                if (user) {
                    user = viewerHandler.updateUser(username, {rank: rank});
                    util.chatter.log(null, styles.event.join(user.name + ' has joined!'));
                    run(viewerHandler.on.join, [user]);
                } else {
                }
            }
        } else return false;
    },
    create: function (user) {
        var now = new Date();
        var newUser = new global.database.users({
            name: user.name,
            time: 0,
            create: now,
            rank: user.rank,
            chatting: true
        });
        var result = sync.wait(newUser, 'save');
        console.log(result);

        util.chatter.log(null, styles.event.join(user.name + ' has joined!'));
        run(viewerHandler.on.create, [user, callback]);
        if (callback) callback(user);
    },
    part: function (username) {
        var user = viewerHandler.getUser(username);
        if (user.chatting && user.rank < ranks.broadcaster) {
            util.chatter.log(null, styles.event.leave(username + ' has left!'));
            user.update({$set: {
                chatting: false
            }});
            run(viewerHandler.on.part, [username]);
        }
    },
    on: {
        join: {},
        part: {},
        create: {}
    },
    stats: {
        rank: function (user) {
            for (var name in ranks) if (ranks[name] == user.rank) return name;
            return "unknown" + (typeof user.rank == "number" ? " (" + user.rank + ")" : "");
        }
    }
};

module.exports = viewerHandler;
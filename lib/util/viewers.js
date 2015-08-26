
var request = global.modules.request;
var sync = global.modules.sync;
var util = global.util;
var database = global.database;
var fs = global.modules.fs;

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

var updateUser = function (user, data) {
    sync.wait(user, "update", [data, {}, sync.defer()]);
    return user;
};

var handler = module.exports = {
    isBlacklisted: function (user) {
        return !user ? (
            typeof this == "object" && "name" in this ? options.core.blacklist.indexOf(this.name) : false
        ):(
            options.core.blacklist.indexOf(user.name) + options.core.blacklist.indexOf(user) > -1
        );
    },
    cleanup: function () {
        var users = handler.getUsers();
        for (var i = 0; i < users.length; i++) {
            if (!users[i].name || handler.isBlacklisted(users[i])) {
                users[i].remove();
            } else {
                var dupes = handler.getUsers({name: users[i].name}, false);

                if (dupes.length > 1) {
                    var earliest = null;
                    for (var j = 0; j < dupes.length; j++) {
                        if (earliest == null || dupes[j].create < earliest.create) {
                            if (earliest) earliest.remove();
                            earliest = dupes[j];
                        } else dupes[j].remove();
                    }
                }
                if (users[i].username) updateUser(users[i], {name: users[i].username, username: undefined});
                if (users[i].firstjoin) updateUser(users[i], {create: users[i].firstjoin, firstjoin: undefined});
                if (!("rank" in users[i])) updateUser(users[i], {rank: 0});
            }
        }
    },
    recent: { joins: {}, parts: {} },
    get: function (user) {
        if (typeof user == "string") find = {name: user};
        else if (!("name" in user)) return {name: user, undefined: true};
        else find = {name: user.name};
        user = this.getUser(find);
        if (!user) user = {name: find.name, undefined: true};
        return user;
    },
    updateUser: function (user, data) {
        if (data && typeof data == "object") {
            if ("rank" in data) {
                if (!(data.rank > user.rank || Math.floor(data.rank / 2) * 2 < user.rank)) delete data.rank;
            }
            updateUser(user, data);
        }
    },
    getUsers: function (req, singularise) {
        if (!req) req = {};
        var result = sync.wait(database.users.find(req), 'exec', [sync.defer('users')]);
        return (singularise === true || singularise === undefined) && result.length == 1 ? result[0] : result;
    },
    getUser: function (req) {
        var result = this.getUsers(req);
        if (result.constructor.name != "Array") return result;
        else if (result.length == 0) return undefined;
        else return result[0];
    },
    update: function (force) {
        for (var name in this.recent.joins) {
            if (--this.recent.joins[name] == 0) {
                delete this.recent.joins[name];
            }
        }
        for (var name in this.recent.parts) {
            if (--this.recent.parts[name] == 0) {
                delete this.recent.parts[name];
                this.completePart(name);
            }
        }
        var result = sync.wait(null, request, ['https://tmi.twitch.tv/group/user/' + global.bot.channel + '/chatters', sync.defer('response')]);
        if (result.statusCode != 200) {
            util.chatter.log(null, 'Userlist check failed.');
        }
        var twitchList = JSON.parse(result.body).chatters;
        var chatters = {};
        for (var i = 0; i < twitchList.viewers.length; i++) chatters[twitchList.viewers[i]] = ranks.new;
        for (var i = 0; i < twitchList.moderators.length; i++) chatters[twitchList.moderators[i]] = ranks.mod;

        for (var name in chatters) {
            this.tryJoin(name, {rank: chatters[name]});
        }

        var oldChatters = this.getUsers({chatting: true});
        for (var i = 0; i < oldChatters.length; i++) {
            var name = oldChatters[i].name;
            // and for any user that was here and isn't anymore...
            if (!(name in chatters || name in this.recent.joins)) {
                if (force) {
                    this.completePart(this.get(name), true);
                } else this.part(this.get(name));
            }
        }
    },
    create: function (name, data) {
        // TODO catch trying to create a user w/ name of channel
        var newUser = new global.database.users({
            name: name,
            time: 0,
            create: new Date,
            rank: data && "rank" in data ? data.rank : 0,
            chatting: false
        });
        var result = sync.wait(newUser, 'save', [sync.defer()]);
        return newUser;
    },
    tryJoin: function (name, data) {
        var u = this.get(name);
        if (!u || u.undefined) u = this.create(name, data);
        else this.updateUser(u, data);
        this.join(u);
        return u;
    },
    join: function (user) {
        // TODO remove error
        if (user.name == undefined || user.name == "undefined") throw new Error;
        if (!user.chatting && !this.isBlacklisted(user)) {
            if (user.name in this.recent.parts) {
                delete this.recent.parts[user.name];
            }
            this.recent.joins[user.name] = options.advanced.padding;
            util.chatter.log(null, styles.event.join(user.name + ' has joined!'));
            updateUser(user, {chatting: true});
            run(handler.on.join, [user]);
        }
    },
    part: function (user, silent) {
        if (user.chatting && !this.isBlacklisted(user) && !(user.name in this.recent.joins)) {
            this.recent.parts[user.name] = options.advanced.padding;
            //util.chatter.log.debug((new Error).stack);
        }
    },
    completePart: function (user, silent) {
        if (user.chatting && !this.isBlacklisted(user) && !(user.name in this.recent.joins)) {
            if (!silent) util.chatter.log(null, styles.event.leave(user.name + ' has left!'));
            updateUser(user, {chatting: false});
            run(handler.on.part, [user]);
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

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

var handler = module.exports = {
    isBlacklisted: function (user) {
        return !user ? false : options.core.blacklist.indexOf(user.name) + options.core.blacklist.indexOf(user) > -1;
    },
    cleanup: function () {
        var users = this.getUsers();
        for (var i = 0; i < users.length; i++) {
            if (!users[i].name || this.isBlacklisted(users[i])) {
                users[i].remove();
            } else {
                if (users[i].username) sync.wait(users[i], "update", [{name: users[i].username, username: undefined}, {}, sync.defer()]);
                if (!("rank" in users[i])) sync.wait(users[i], "update", [{rank: 0}, {}, sync.defer()]);
            }
        }
    },
    recents: {},
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
            sync.wait(user, "update", [data, {}, sync.defer()]);
        }
    },
    getUsers: function (req) {
        if (!req) req = {};
        var result = sync.wait(database.users.find(req), 'exec', [sync.defer('users')]);
        return result.length == 1 ? result[0] : result;
    },
    getUser: function (req) {
        var result = this.getUsers(req);
        if (result.constructor.name != "Array") return result;
        else if (result.length == 0) return undefined;
        else return result[0];
    },
    update: function () {
        for (var name in this.recents) {
            if (--this.recents[name] == 0) {
                delete this.recents[name];
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
            if (!(name in chatters || name in this.recents)) this.part(this.get(name));
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
        // TODO
        if (user.name == undefined || user.name == "undefined") throw new Error;
        if (!user.chatting && !this.isBlacklisted(user)) {
            util.chatter.log(null, styles.event.join(user.name + ' has joined!'));
            sync.wait(user, "update", [{chatting: true}, {}, sync.defer()]);
            run(handler.on.join, [user]);
        }
    },
    part: function (user, silent) {
        if (user.chatting && !this.isBlacklisted(user)) {
            if (!silent) util.chatter.log(null, styles.event.leave(user.name + ' has left!'));
            sync.wait(user, "update", [{chatting: false}, {}, sync.defer()]);
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
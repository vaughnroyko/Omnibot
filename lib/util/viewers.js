
var request = global.modules.request;
var sync = global.modules.sync;
var util = global.util;
var database = global.database;
var fs = global.modules.fs;

var ranks = global.data.ranks;
var options = global.options;
var styles = global.styles;

var updateUserDoc = function (user, data, autoset) {
    if (typeof user == "string") {
        user = handler.get(user);
    }
    if (!user.undefined) {
        try {
            sync.wait(user, "update", [data, {}, sync.defer()]);
        } catch (err) {
            if (err.name == "CastError") {
                console.log("There was an error updating the user '{0}' with the data: {1}".weave(user.name, JSON.stringify(data)));
            } else throw err;
        }
    }
    return user;
};

var listeners = {
    join: {},
    part: {},
    create: {},
    cleanup: {}
};

var handler = module.exports = {

    util: {
        getRank: function (rank) {
            if (rank in ranks) return ranks[rank];
            return 0;
        }
    },

    on: function (evt, callback) {
        if (evt in listeners) {
            var index = evt + "." + Date.now();
            listeners[evt][index] = callback;
            return index;
        }
        return false;
    },
    off: function (index) {
        if (typeof index == "string") {
            index = index.split('.');
            if (index.length > 0) {
                evt = index[0];
                index = index[1];
                if (evt in listeners && index in listeners[evt]) delete listeners[evt][index];
            }
        }
    },
    trigger: function (evt, args) {
        if (evt in listeners) {
            var callbacks = listeners[evt];
            for (var index in callbacks) {
                if (typeof callbacks[index] == "function") {
                    callbacks[index].apply(null, args === undefined ? [] : args);
                }
            }
        }
    },
    call: function (index, args) {
        if (typeof index == "string") {
            index = index.split('.');
            if (index.length > 0) {
                evt = index[0];
                index = index[1];
                if (evt in listeners && index in listeners[evt]) listeners[evt][index].apply(null, args);
            }
        }
    },

    // tests if a user is blacklisted (hidden) from the bot
    isBlacklisted: function (user) {
        return !user ? (
            typeof this == "object" && "name" in this ? options.core.blacklist.indexOf(this.name) : false
        ):(
            (typeof user == "object" && 'name' in user ? options.core.blacklist.indexOf(user.name) : options.core.blacklist.indexOf(user)) > -1
        );
    },
    cleanup: function () {
        var users = handler.getUsers();
        var nms = [];
        for (var i = 0; i < users.length; i++) {
            if (!users[i].name || handler.isBlacklisted(users[i])) {
                users[i].remove();
            } else {
                if (!users[i].displayName) users[i].displayName = users[i].name;
                users[i].save(function () {});
                if (nms.indexOf(users[i].name) > -1) continue;
                var dupes = handler.getUsers({name: users[i].name}, false);

                if (dupes.length > 1) {
                    nms.push(users[i].name);
                    var earliest = null;
                    for (var j = 0; j < dupes.length; j++) {
                        if (earliest == null || dupes[j].create < earliest.create) {
                            if (earliest) earliest.remove();
                            earliest = dupes[j];
                        } else dupes[j].remove();
                    }
                }
                if (users[i].username) updateUserDoc(users[i], {name: users[i].username, username: undefined});
                if (users[i].firstjoin) updateUserDoc(users[i], {create: users[i].firstjoin, firstjoin: undefined});
                if (!("rank" in users[i])) updateUserDoc(users[i], {rank: 0});
            }
        }
        this.updateTrust();
        this.trigger('cleanup');
    },
    updateTrust: function () {
        database.users.update(
			{$and: [
				{time: {$gte: options.core.userTrustTime} },
				{rank: {$lt: ranks.viewer} }
			]},
			{ $set: {rank: ranks.viewer} },
			{ multi: true },
			function (err, raw) {
				if (err) throw err;
			}
        );
    },
    updateDisplayName: function (name, displayName) {
        if (displayName === undefined) displayName = name;
        updateUserDoc(name, {displayName: displayName});
    },

    recent: { joins: {}, parts: {} },

    update: function (user, data) {
        updateUserDoc(user, data);
    },

    updateSafe: function (user, data) {
        if (data && typeof data == "object") {
            if ("rank" in data) data.rank = this.calcRank(user.rank, data.rank);
            if (user.name == global.bot.channel) data.rank = 4;
            updateUserDoc(user, data);
        }
    },

    calcRank: function (oldRank, newRank) {
        if (typeof oldRank != "number") oldRank = 0;
        if (Math.abs(newRank - oldRank) > 1) return Math.min(oldRank, newRank);
        else return Math.max(oldRank, newRank);
    },

    // gets all the users that match a mongo query
    getUsers: function (req, singularise) {
        if (!req) req = {};
        var result = sync.wait(database.users.find(req), 'exec', [sync.defer('users')]);
        return (singularise === true || singularise === undefined) && result.length == 1 ? result[0] : result;
    },

    // finds a user with a mongo query object, if multiple match it returns the first match
    find: function (req) {
        var result = this.getUsers(req);
        if (result.constructor.name != "Array") return result;
        else if (result.length == 0) return undefined;
        else return result[0];
    },

    // gets a user from a username
    get: function (user) {
        if (typeof user == "string") {
            user = user.toLowerCase();
            find = {name: user};
        }
        else if (!("name" in user)) return {name: user, displayName: find.name, undefined: true};
        else find = {name: user.name};
        user = this.find(find);
        if (!user) user = {name: find.name, displayName: find.name, undefined: true};
        if (!("displayName" in user)) user.displayName = user.name;
        return user;
    },

    // syncs the userlist from twitch
    sync: function (force) {
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
        if (result.statusCode == 200) {
            var twitchList = JSON.parse(result.body).chatters;
            var chatters = {};
            for (var i = 0; i < twitchList.viewers.length; i++) chatters[twitchList.viewers[i]] = ranks.new;
            for (var i = 0; i < twitchList.moderators.length; i++) chatters[twitchList.moderators[i]] = ranks.mod;

            for (var name in chatters) {
                this.beginJoin(name, {rank: chatters[name]});
            }

            var oldChatters = this.getUsers({chatting: true});
            for (var i = 0; i < oldChatters.length; i++) {
                var name = oldChatters[i].name;
                // and for any user that was here and isn't anymore...
                if (!(name in chatters || name in this.recent.joins)) {
                    if (force) {
                        this.completePart(this.get(name), true);
                    } else this.completePart(this.get(name));
                }
            }
        } else {
            util.chatter.print('Userlist check failed.');
        }
    },

    // creates a new user
    create: function (name, data) {
        // TODO catch trying to create a user w/ name of channel
        var newUser = new global.database.users({
            name: name,
            time: 0,
            create: new Date,
            rank: data && "rank" in data ? data.rank : 0,
            chatting: false,
            displayName: name
        });
        var result = sync.wait(newUser, 'save', [sync.defer()]);
        return newUser;
    },


    beginJoin: function (name, data) {
        if (data === undefined) data = {};
        var u = this.get(name);
        if (!u || u.undefined) u = this.create(name, data);
        else this.updateSafe(u, data);
        this.completeJoin(u);
        return u;
    },
    completeJoin: function (user) {
        // TODO remove error
        if (user.name == undefined || user.name == "undefined") throw new Error;
        if (!user.chatting && !this.isBlacklisted(user)) {
            if (user.name in this.recent.parts) {
                delete this.recent.parts[user.name];
            }
            this.recent.joins[user.name] = options.advanced.padding;
            util.chatter.print(styles.event.join(util.weave("bot.users.join", user)));
            updateUserDoc(user, {chatting: true});
            this.trigger('join', [user]);
        }
    },

    beginPart: function (user, silent) {
        if (user.chatting && !this.isBlacklisted(user) && !(user.name in this.recent.joins)) {
            this.recent.parts[user.name] = options.advanced.padding;
            //util.chatter.log.debug((new Error).stack);
        }
    },
    completePart: function (user, silent) {
        if (user.chatting && !this.isBlacklisted(user) && !(user.name in this.recent.joins)) {
            if (!silent) util.chatter.print(styles.event.leave(util.weave("bot.users.part", user)));
            updateUserDoc(user, {chatting: false});
            this.trigger('part', [user]);
        }
    },

    addStat: function (name, fn) {
        stats[name] = fn;
    },
    removeStat: function (name) {
        delete stats[name];
    }
};

Object.defineProperty(handler, "stats", { get: function () { return stats; } });

var stats = {
    rank: function (user) {
        for (var name in ranks) if (ranks[name] == user.rank) return name;
        return "unknown" + (typeof user.rank == "number" ? " (" + user.rank + ")" : "");
    }
};
var options = global.options;
var styles = global.styles;
var ranks = global.data.ranks;
var database = global.database;
var mongoose = global.modules.mongoose;
var viewers = global.util.viewers;
var sync = global.modules.sync;

var chatter = global.util.chatter;

database.points = mongoose.model(options.twitch.channel + '.points', mongoose.Schema({
    user: String,
    count: Number
}));

var addPointsForUser = function (user) {
    var newPoints = new database.points({
        user: user.name,
        count: options.core.modules.points.startWith
    });
    newPoints.save(function(err, result) {
        chatter.print(styles.points(util.weave("points.firstjoin", user, options.core.modules.points.startWith)));
    });
};
viewers.on('create', addPointsForUser);

var outputViewerPoints = function (user) {
    database.points.findOne({user: user.name}, function(err, points) {
        if (points) {
            chatter.print(styles.points(util.weave("points.joinInfo", user, points.count)));
        } else {
            addPointsForUser(user);
        }
    });
};
viewers.on('join', outputViewerPoints);

var cleanupPoints = function () {
    var users = sync.wait(database.points.find({}), 'exec', [sync.defer('users')]);
    var nms = [];
    for (var i = 0; i < users.length; i++) {
        if (!users[i].user || viewers.isBlacklisted(users[i].user)) {
            users[i].remove();
        } else {
            if (nms.indexOf(users[i].user) > -1) continue;
            var dupes = sync.wait(database.points.find({name: users[i].user}), 'exec', [sync.defer('users')]);

            if (dupes.length > 1) {
                nms.push(users[i].user);
                var greatest = null;
                for (var j = 0; j < dupes.length; j++) {
                    if (greatest == null || dupes[j].count > greatest.count) {
                        if (greatest) greatest.remove();
                        greatest = dupes[j];
                    } else {
                        dupes[j].remove();
                    }
                }
            }
        }
    }
};
viewers.on('cleanup', cleanupPoints);

viewers.addStat('points', function (user) {
    var points = sync.wait(database.points.findOne({user: user.name}), 'exec', [sync.defer('points')]);
    if (points && "count" in points) points = points.count;
    if (points) {
        return "" + points + " points";
    } else {
        return undefined;
    }
});

global.bot.addClock(function () {
    if (util.isLive()) {
        var users = viewers.getUsers({chatting: true, name: {$nin: options.core.blacklist}});
        var names = [];
        for (var i = 0; i < users.length; i++) names.push(users[i].name);
        database.points.update(
            {user: {$in: names}},
            {$inc: {count: 1}},
            {multi: true},
            function (err, raw) {
                if (err) throw err;
            }
        );
    }
});

var balance = function (user) {
    return pointDocument(user).count;
};
var pointDocument = function (user) {
    return sync.wait(database.points, 'findOne', [{user: typeof user == "string" ? user : user.name}, sync.defer('points')]);
};

module.exports = {
    donate: function (user, amount, to) {
        if (typeof to == "string") {
            to = to.toLowerCase();
            var points = pointDocument(user);
            amount = parseInt(amount);
            if (amount > 0 && points.count >= amount) {
                to = viewers.get(to);
                var toPoints = pointDocument(to);
                if (to && toPoints) {
                     points.edit({$inc: {count: -amount}});
                     toPoints.edit({$inc: {count: amount}});
                     chatter.say(util.weave("points.donate.success", user, to, amount));
                } else {
                    chatter.say(util.weave("points.donate.notExist", user.name, to));
                }
            } else {
                chatter.say(util.weave(amount > 0 ? "points.donate.notEnough" : "points.donate.thief", user, amount - points.count));
            }
        }
    },

    /*
      usage: !top <count=[default, customisable in core.cson]>
    */
    top: function (user, count) {
        var parsed;
        if (count === undefined || isNaN(parsed = parseInt(count)) || parsed <= 0) count = options.output.list.size.default;
        count = Math.min(count, options.output.list.size.max);

        database.points.find({
            $nor: [
                {user: global.bot.channel},
                {user: global.bot.name}
            ]
        }).sort({count: -1}).limit(count).lean().exec(function(err, points) {
            if (points) {
                chatter.say(util.weave("points.top", points.length, points));
            } else {
                chatter.say(styles.console.error(options.output.fail.default));
            }
        });
    },
    /*
      usage: !balance <username=[self]>
    */
    balance: function (user, who) {
        var self = true;
        if (who) {
            user = util.viewers.get(who);
            self = false;
        }
        if (util.viewers.isBlacklisted(user)) {
            chatter.say(util.weave("points.balance.blacklisted",
                user, // name of user to get points of
                self, // if the user is the one who asked for the points
                user.name == global.bot.name // if the user is me
            ));
        } else {
            var points = balance(user);
            if (typeof points == "number") {
                chatter.say(util.weave("points.balance.normal",
                    user,
                    points,
                    self
                ));
            } else {
                chatter.say(util.weave("points.balance.unknown",
                    user,
                    self
                ));
            }
        }
    },
    /*
      usage: !tax <[Number] || *> <[User] || *>
      limitations: broadcaster || (moderator && modsCanRunBroadcasterCommands [defaults to true in core.cson])
    */
    tax: function (user, amount, users, message) {
        if (!message) {
            message = options.output.stealSuccess;
            if (amount < 0) amount = 0;
        }
        if (user.rank >= ranks.admin) {
            var bounty = amount;
            if (bounty == "*") {
                bounty = {$set: {
                    points: options.core.points.startWith
                }};
            } else {
                bounty = {$inc: {
                    points: -bounty
                }};
            }
            var victim = users;
            if (victim == "*") victim = {};
            else victim = {username: victim.toLowerCase()};
            var update = function () {
                database.users.find({
                    $nor: [
                        {name: global.bot.channel},
                        {name: global.bot.name}
                    ]
                }).update(
                    victim,
                    bounty,
                    { multi: true },
                    function (err, raw) {
                        if (message) chatter.say(styles.points(message.weave(
                            Math.abs(prior === null ? amount * raw.nModified : (raw.nModified == 0 ? 0 : prior - raw.nModified * options.core.points.startWith)),
                            raw.nModified
                        )));
                    }
                );
            }
            var prior = null;
            if (amount == "*") {
                database.users.aggregate(
                    {$match: {
                        $nor: [
                            {username: global.bot.channel},
                            {username: global.bot.name}
                        ]
                    }},
                    {$group: {
                        _id: null,
                        total: {
                            $sum: "$points"
                        }
                    }}
                ).exec(function(err, docs) {
                    prior = docs[0].total;
                    update();
                });
            } else {
                update();
            }
        }
    },
    distribute: function (user, amount, users) {
        if (amount < 0) amount = 0;
        if (amount != "*") amount = -amount;
        module.exports.tax(user, amount, users, options.output.distributeSuccess);
    }
};
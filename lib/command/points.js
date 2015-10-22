var options = global.options;
var styles = global.styles;
var ranks = global.data.ranks;
var database = global.database;
var mongoose = global.modules.mongoose;
var viewers = global.util.viewers;
var sync = global.modules.sync;
var bot = global.bot;

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
        util.chatter.log(null, styles.points(options.output.points.firstjoin.weave(user.name, options.core.modules.points.startWith)));
    });
};
viewers.on('create', addPointsForUser);

var outputViewerPoints = function (user) {
    database.points.findOne({user: user.name}, function(err, points) {
        if (points) {
            util.chatter.log(null, styles.points(options.output.points.joinInfo.weave(user.name, points.count)));
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

bot.addClock(function () {
    if (util.isLive()) {
        var users = viewers.getUsers({chatting: true, name: {$nin: options.core.blacklist}});
        var names = [];
        for (var i = 0; i < users.length; i++) names.push(users[i].name);
        database.points.update(
            {user: {$in: names}},
            {$inc: {count: 1}},
            {}, function (err, raw) {
                if (err) throw err;
            }
        );
    }
});

module.exports = {
    /*
      usage: !top <count=[default, customisable in core.cson]>
    */
    top: function (user, count) {
        if (count === undefined || parseInt(count) <= 0) count = options.output.list.size.default;
        count = Math.min(parseInt(count), options.output.list.size.max);

        database.points.find({
            $nor: [
                {user: bot.channel},
                {user: options.twitch.identity.username}
            ]
        }).sort({count: -1}).limit(count).lean().exec(function(err, points) {
            if (points) {
                util.chatter.say(options.output.points.top.weave(points.length, points));
            } else {
                util.chatter.say(styles.console.error(options.output.fail.default));
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
        user.name = user.name.toLowerCase();
        if (util.viewers.isBlacklisted(user)) {
            util.chatter.say(options.output.points.balance.blacklisted.weave(
                user.name, // name of user to get points of
                self, // if the user is the one who asked for the points
                user.name == options.twitch.identity.username // if the user is me
            ));
        } else {
            database.points.findOne({user: user.name}, function(err, points) {
                if (points && points.count) {
                    util.chatter.say(options.output.points.balance.normal.weave(
                        user.name,
                        points.count,
                        self
                    ));
                } else {
                    util.chatter.say(options.output.points.balance.unknown.weave(
                        user.name,
                        self
                    ));
                }
            });
        }
    },
    /*
      usage: !tax <[Number] || *> from <[User] || *>
      limitations: broadcaster || (moderator && modsCanRunBroadcasterCommands [defaults to true in core.cson])
    */
    tax: function (user, amount, word, users, message) {
        if (!message) {
            message = options.output.stealSuccess;
            if (amount < 0) amount = 0;
        }
        if (user.rank >= ranks.admin) {
            if (word == "from") {
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
                            {name: bot.channel},
                            {name: options.twitch.identity.username}
                        ]
                    }).update(
                        victim,
                        bounty,
                        { multi: true },
                        function (err, raw) {
                            util.chatter.say(styles.points(message.weave(
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
                                {username: bot.channel},
                                {username: options.twitch.identity.username}
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
        }
    },
    distribute: function (user, amount, word, users) {
        if (word == "to") {
            if (amount < 0) amount = 0;
            word = "from";
            if (amount != "*") amount = -amount;
            module.exports.tax(user, amount, word, users, options.output.distributeSuccess);
        }
    }
};
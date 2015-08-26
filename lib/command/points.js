var options = global.options;
var styles = global.styles;
var ranks = global.data.ranks;
var database = global.database;
var mongoose = global.modules.mongoose;
var viewers = global.util.viewers;
var sync = global.modules.sync;

database.points = mongoose.model(options.twitch.channel + '.points', mongoose.Schema({
    user: String,
    count: Number
}));

viewers.on.create.points = function (user) {
    var newPoints = new global.database.points({
        user: user.name,
        count: options.core.modules.points.startWith
    });
    newPoints.save(function(err, result) {
        util.chatter.log(null, styles.points('Gave ' + user.name + ' ' + options.core.modules.points.startWith + ' points for joining for the first time.'));
    });
};
viewers.on.join.points = function (user) {
    global.database.points.findOne({user: user.name}, function(err, points) {
        if (points) {
            util.chatter.log(null, styles.points(user.name + ' has ' + points.count + ' points!'));
        } else {
            global.util.viewers.on.create.points(user);
        }
    });
};
viewers.stats.points = function (user) {
    var points = sync.wait(global.database.points.findOne({user: user.name}), 'exec', [sync.defer('points')]);
    if (points && "count" in points) points = points.count;
    if (points) {
        return "" + points + " points";
    } else {
        return undefined;
    }
};

global.bot.updates.push({ // increment user data
    time: 60000,
    func: function () {
        if (util.isLive()) {
            var users = viewers.getUsers({chatting: true});
            for (var i = 0; i < users.length; i++) {
                if (!viewers.isBlacklisted(users[i].name)) {
                    database.points.findOneAndUpdate(
                        {user: users[i].name},
                        {$inc: {count: 1}},
                        {}, function (err, raw) {
                            console.log("update", err, raw);
                        }
                    );
                }
            }
        }
    }
});

module.exports = {
    /*
      usage:
        !points disable <user>
        !points enable <user>
            - disables and enables points for a specific user or a list of users
    */
    points: function (user, what, who) {
        if (what == "disable") {

        }
    },
    /*
      usage: !top <count=[default, customisable in core.cson]>
    */
    top: function (user, count) {
        if (typeof count != 'number' || count <= 0) count = options.output.list.size.default;
        count = Math.min(count, options.output.list.size.max);

        global.database.points.find({
            $nor: [
                {user: global.bot.channel},
                {user: options.twitch.identity.username}
            ]
        }).sort({points: -1}).limit(count).exec(function(err, points) {
            var output = "Top " + count + ": ";
            if (points) {
                for (var i = 0; i < points.length; i++) {
                    output += points[i].user + ": " + points[i].count + " | ";
                }
                output = output.substring(0, output.length - 3);
                util.chatter.say(output);
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
        if (util.viewers.isBlacklisted(user)) {
            util.chatter.say(options.output.points.balance.blacklisted.format(
                user.name, // name of user to get points of
                self, // if the user is the one who asked for the points
                user.name == options.twitch.identity.username // if the user is me
            ));
        } else {
            global.database.points.findOne({user: user.name}, function(err, points) {
                if (points && points.count) {
                    util.chatter.say(options.output.points.balance.normal.format(
                        user.name,
                        points.count,
                        self
                    ));
                } else {
                    util.chatter.say(options.output.points.balance.unknown.format(
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
                    global.database.users.find({
                        $nor: [
                            {name: global.bot.channel},
                            {name: options.twitch.identity.username}
                        ]
                    }).update(
                        victim,
                        bounty,
                        { multi: true },
                        function (err, raw) {
                            util.chatter.say(styles.points(message.format(
                                Math.abs(prior === null ? amount * raw.nModified : (raw.nModified == 0 ? 0 : prior - raw.nModified * options.core.points.startWith)),
                                raw.nModified
                            )));
                        }
                    );
                }
                var prior = null;
                if (amount == "*") {
                    global.database.users.aggregate(
                        {$match: {
                            $nor: [
                                {username: global.bot.channel},
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
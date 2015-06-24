var options = global.options;
var styles = global.styles;
var ranks = global.data.ranks;

module.exports = {
    /*
      usage: !top <count=[default, customisable in core.cson]>
    */
    top: function (user, params) {
        var count = params[0] !== undefined && params[0] > 0 ? Math.min(params[0], options.output.messages.maxListSize) : options.output.messages.defaultListSize;
        global.database.users.find({
            $nor: [
                {username: global.bot.channel},
                {username: options.twitch.identity.username}
            ]
        }).sort({points: -1}).limit(count).exec(function(err, docs) {
            var output = "Top " + count + ": ";
            if (docs) {
                for (var i = 0; i < docs.length; i++) {
                    output += docs[i].username + ": " + docs[i].points + " | ";
                }
                output = output.substring(0, output.length - 3);
                util.say(output);
            } else {
                util.say(styles.console.error("Something went wrong."));
            }
        });
    },
    /*
      usage: !balance <username=[self]>
    */
    balance: function (user, params) {
        var self = true;
        if (params.length > 0) {
            user = {name: params[0].toLowerCase(), rank: global.bot.users[params[0].toLowerCase()]};
            self = false;
        }
        if (user.rank == ranks.Broadcaster || user.name == global.options.twitch.identity.username) {
            util.say((self? "Your" : (user.name == options.twitch.identity.username ? "My own": user.name + "'s")) + " balance exceeds the limits of my computational power" + (self? ", " + user.name : "") + ".");
        } else {
            global.database.users.findOne({username: user.name}, function(err, docs) {
                if (docs) {
                    util.say((self? "You have " : user.name + " has ") + docs.points + " points" + (self? ", " + user.name : "") + "!");
                } else {
                    util.say("Wait, who " + (self? "are you" : "is " + user.name) + " again" + (self? ", " + user.name : "") + "?");
                }
            });
        }
    },
    /*
      usage: !tax <[Number] || *> from <[User] || *>
      limitations: broadcaster || (moderator && modsCanRunBroadcasterCommands [defaults to true in core.cson])
    */
    tax: function (user, params, message) {
        if (!message) {
            message = options.output.stealSuccess;
            if (params[0] < 0) params[0] = 0;
        }
        if (user.rank >= ranks.Broadcaster || (options.core.modsCanRunBroadcasterCommands && user.rank == ranks.Moderator)) {
            if (params[1] == "from") {
                var bounty = params[0];
                if (bounty == "*") {
                    bounty = {$set: {
                        points: options.core.points.startWith
                    }};
                } else {
                    bounty = {$inc: {
                        points: -bounty
                    }};
                }
                var victim = params[2];
                if (victim == "*") victim = {};
                else victim = {username: victim};
                var update = function () {
                    global.database.users.find({
                        $nor: [
                            {username: global.bot.channel},
                            {username: options.twitch.identity.username}
                        ]
                    }).update(
                        victim,
                        bounty,
                        { multi: true },
                        function (err, raw) {
                            util.say(styles.points(message.format(
                                Math.abs(prior === null ? params[0] * raw.nModified : (raw.nModified == 0 ? 0 : prior - raw.nModified * options.core.points.startWith)),
                                raw.nModified
                            )));
                        }
                    );
                }
                var prior = null;
                if (params[0] == "*") {
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
    distribute: function (user, params) {
        if (params[1] == "to") {
            if (params[0] < 0) params[0] = 0;
            params[1] = "from";
            if (params[0] != "*") params[0] = -params[0];
            module.exports.tax(user, params, options.output.distributeSuccess);
        }
    }
};
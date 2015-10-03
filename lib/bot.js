
require('./init.js');

var mongoose = global.modules.mongoose;
var irc = global.modules.irc;
var season = global.modules.season;
var sync = global.modules.sync;

var options = global.options;
var util = global.util;
var ranks = global.data.ranks;
var styles = global.styles;

// if we can't connect to the database, there's no point in going any farther.
mongoose.connect(options.mongo.path, function(err) {
	if (err) {
        util.chatter.log(null, styles.console.error(err));
		process.exit();
	} else {
		util.chatter.log(null, styles.console.info('Connected to MongoDB.'));

		global.bot = bot = {
			exit: function () {
				if (this.client) this.client.disconnect();
			},
		    channelData: {},

			channel: options.twitch.channel,

		    updates: [
		        { // increment user data
		            time: 60000,
		            func: function () {
		                util.viewers.update();
		                util.getData();
						if (util.isLive()) {
							database.users.update(
								{$and: [
									{chatting: true},
									{name: {$nin: options.core.blacklist}},
								]},
								{ $inc: {time: 1} },
								{ multi: true },
								function (err, raw) {
				                    if (err) throw err;
								}
							);
						}
		            }
		        }
		    ],
			commands: null
		};

		if (bot.channel[0] == '#') bot.channel = bot.channel.substring(1);

		bot.commands = require('./command/core.js');

		if (options.core.modules.customCommands.enabled) {
			database.commands.find(function(err, docs) {
				for (var i = 0; i < docs.length; i++) {
					global.customCommands.load(docs[i].name);
				}
			});
		}

		bot.client = new irc.client({
			options: {
				debug: false,
				debugIgnore: [],
				tc: 1
			},
			identity: options.twitch.identity,
			channels: [options.twitch.channel]
		});
		bot.client.connect();

		bot.client.on("connecting", function (server, port) {
		    util.chatter.log(null, styles.console.info("Connecting to Twitch..."));
		});

		bot.client.on("logon", function() {
			util.chatter.log(null, styles.console.info("Logging in..."));
		});

		bot.client.on("connected", function (server, port) {
			util.chatter.log(null, styles.console.info("Connected to #{0}.".weave(bot.channel)));

		    sync.lazy(function () {
				util.viewers.cleanup();
				util.viewers.update(true);

				if (typeof options.output.listUsers == "string") {
					var users = util.viewers.getUsers({chatting: true});

					var userlist = [];
					for (var i = 0; i < users.length; i++) {
						userlist.push(styles.console.data(users[i].name));
					}
					util.chatter.log(null, styles.console.info(options.output.listUsers.weave(userlist.length == 0 ? options.output.noUsers : userlist.join(options.output.list.separator))));
				}
				util.chatter.log(null, styles.console.info("Ready!"));
				bot.client.addListener('chat', util.chatter.listen);

				for (var i = 0; i < bot.updates.length; i++) {
					var update = bot.updates[i];
				    update.func();
				    update.repeater = setInterval(update.func, update.time);
				}
			});
		});

		bot.client.on("disconnected", function (reason) {
			for (var i = 0; i < bot.updates.length; i++) {
				var update = bot.updates[i];
				clearInterval(update.repeater);
			}
			util.chatter.log(null, styles.console.info("Disconnected from Twitch."));
		});

		bot.client.on("join", function (channel, name) {
			util.viewers.tryJoin(name);
		});
		bot.client.on("part", function (channel, name) {
			util.viewers.part(util.viewers.get(name));
		});
	}
});
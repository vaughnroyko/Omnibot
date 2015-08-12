
require('./init.js');

if (global.modules.fs.existsSync("error.log")) global.modules.fs.unlinkSync("error.log");

var mongoose = global.modules.mongoose;
var irc = global.modules.irc;
var season = global.modules.season;

var options = global.options;
var util = global.util;
var ranks = global.data.ranks;

// if we can't connect to the database, there's no point in going any farther.
mongoose.connect(options.mongo.path, function(err) {
	if (err) {
        util.chatter.log(null, styles.console.error(err));
		process.exit();
	} else {
		util.chatter.log(null, styles.console.info('Connected to MongoDB.'));

		util.viewers.cleanup();

		global.bot = bot = {
			exit: function () {
				this.client.disconnect(); //Stop IRC
		        process.exit(); //Stop node
			},
		    channelData: {},

			channel: options.twitch.channels[0],

		    updates: [
		        { // increment user data
		            time: 60000,
		            func: function () {
		                util.viewers.update();
		                util.getData();
						if (util.isLive()) {
							database.users.find({$and: [
								{chatting: true},
								{rank: {$lt: ranks.broadcaster}},
							]}).update(
								{username: user},
								{$inc: {time: 1}},
								{ multi: true },
								function (err, raw) {}
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

		bot.client = new irc.client(options.twitch);
		bot.client.connect();


		bot.client.on("connecting", function (server, port) {
		    util.chatter.log(null, styles.console.info("Connecting to Twitch..."));
		});

		bot.client.on("logon", function() {
			util.chatter.log(null, styles.console.info("Logged in."));
		});

		bot.client.on("connected", function (server, port) {
			util.chatter.log(null, styles.console.info("Connected to Twitch."));

			for (var i = 0; i < bot.updates.length; i++) {
				var update = bot.updates[i];
			    update.func();
			    update.repeater = setInterval(update.func, update.time);
			}

			bot.client.addListener('chat', util.chatter.listen);
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

process.stdin.resume();
var exitHandler = function() {
	util.chatter.log(null, styles.console.info("Shutting down..."));
	global.bot.exit();
};
process.on('SIGINT', exitHandler);
process.on('uncaughtException', function (err) {
	if (!global.modules || !global.modules.fs) global.modules = {
		fs: require('fs-extra')
	};
	console.log(err.stack);
	global.modules.fs.writeFileSync("error.log", err.stack);
	if (options.core.exitOnException) process.exit();
});
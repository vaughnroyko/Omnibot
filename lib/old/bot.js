var initfail;
try { require('./init.js'); } catch (e) {
	initfail = e;
	console.log(initfail.stack);
}
if (!initfail) {

	var mongoose = global.modules.mongoose;
	var irc = global.modules.irc;
	var season = global.modules.season;
	var sync = global.modules.sync;
	var request = global.modules.request;

	var options = global.options;
	var util = global.util;
	var ranks = global.data.ranks;
	var styles = global.styles;
	var chatter = util.chatter;

	// if we can't connect to the database, there's no point in going any farther.
	try {
		sync.wait(mongoose, 'connect', [options.mongo.path, options.mongo.connection, sync.defer()]);
	} catch (err) {
		chatter.print(
			(function (name, message, stack, colorise) {
				if (name == "MongoError" && message == "connect ECONNREFUSED") {
					return colorise("Couldn't connect to MongoDB.");
				} else {
					return colorise(name + ": " + message) + "\n" + stack;
				}
			})(err.name, err.message, Error.trim(err.stack), styles.console.error)
		);
		process.exit(1);
	}

	chatter.print(styles.console.info('Connected to database.'));

	global.bot = bot = {
		exiting: false,
		exitCode: 0,
		exit: function (code) {
			this.exiting = true;
			this.exitCode = code;
			if (this.client) this.client.disconnect();
		},
	    data: {},

		channel: options.twitch.channel,
		name: options.twitch.identity.username,

	    clocks: [],
		addClock: function (func, time) {
			if (time === undefined) time = 60000;
			this.clocks.push({time: time, func: func});
		},

		commands: null,
	    refresh: function () {
	        request('https://api.twitch.tv/kraken/streams/' + bot.channel, function (error, response, body) {
	            if (!error && response.statusCode == 200) {
	                bot.data = JSON.parse(body);
	            } else {
	                chatter.print(styles.console.error("Couldn't get stream data. Response code: " + response.statusCode));
	            }
	        });
	    },
	};

	// main bot clock
	bot.addClock(function () {
		util.viewers.sync();
		bot.refresh();
		if (util.isLive()) {
			// increment user data
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
			util.viewers.updateTrust();
		}
	});


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
	    chatter.print(styles.console.info("Connecting to the server..."));
	});

	bot.client.on("logon", function() {
		chatter.print(styles.console.info("Logging in..."));
	});

	bot.client.on("connected", function () {
		chatter.print(styles.console.info("Connected! Channel: #{0}".weave(bot.channel)));

	    sync.lazy(function () {
			util.viewers.cleanup();
			util.viewers.sync(true);

			if (typeof options.output.listUsers == "string") {
				var users = util.viewers.getUsers({chatting: true}, false);

				var userlist = [];
				for (var i = 0; i < users.length; i++) {
					userlist.push(styles.console.data(users[i].name));
				}

				chatter.print(styles.console.info(util.weave("bot.users.list", userlist)));
			}
			chatter.connect();

			chatter.print(styles.console.info("Ready!"));

			for (var i = 0; i < bot.clocks.length; i++) {
				var clock = bot.clocks[i];
			    clock.func();
			    clock.repeater = setInterval(clock.func, clock.time);
			}
		});
	});

	bot.client.on("disconnected", function (reason) {
		for (var i = 0; i < bot.clocks.length; i++) {
			var clock = bot.clocks[i];
			clearInterval(clock.repeater);
		}
		chatter.print(styles.console.info("Disconnected from Twitch."));
		if (bot.exiting) process.exit(bot.exitCode);
	});

	bot.client.on("join", function (channel, name) {
		util.viewers.beginJoin(name);
	});
	bot.client.on("part", function (channel, name) {
		util.viewers.beginPart(util.viewers.get(name));
	});

}
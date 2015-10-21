
require('./init.js');

var mongoose = global.modules.mongoose;
var irc = global.modules.irc;
var season = global.modules.season;
var sync = global.modules.sync;
var request = global.modules.request;

var options = global.options;
var util = global.util;
var ranks = global.data.ranks;
var styles = global.styles;

// if we can't connect to the database, there's no point in going any farther.
try {
	sync.wait(mongoose, 'connect', [options.mongo.path, options.mongo.connection, sync.defer()]);
} catch (err) {
	util.chatter.log(null, styles.console.error(err));
	process.exit();
}

util.chatter.log(null, styles.console.info('Connected to MongoDB.'));

global.bot = bot = {
	exit: function () {
		if (this.client) this.client.disconnect();
	},
    data: {},

	channel: options.twitch.channel,

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
                util.chatter.log(null, styles.console.error("Couldn't get stream data. Response code: " + response.statusCode));
            }
        });
    },
};

// main bot clock
bot.addClock(function () {
	util.viewers.update();
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
	util.chatter.log(null, styles.console.info("Disconnected from Twitch."));
});

bot.client.on("join", function (channel, name) {
	util.viewers.tryJoin(name);
});
bot.client.on("part", function (channel, name) {
	util.viewers.part(util.viewers.get(name));
});
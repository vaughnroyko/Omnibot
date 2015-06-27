
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
        util.log(null, styles.console.error(err));
		process.exit();
	} else {
		util.log(null, styles.console.info('Connected to MongoDB.'));

		global.bot = bot = {
			exit: function () {
				this.client.disconnect(); //Stop IRC
		        process.exit(); //Stop node
			},
		    channelData: {},
		    users: {},

			channel: options.twitch.channels[0].substring(1),

		    updates: [
		        { // increment user data
		            time: 60000,
		            func: function () {
		                util.getViewers();
		                util.getData();
						if (util.isLive()) {
			                for (var user in bot.users) {
								if (bot.users[user] != ranks.Broadcaster && user != options.twitch.identity.username) {
				                    database.users.update(
										{username: user},
										{$inc: {
											points: 1,
											time: 1
										}},
										{ multi: true },
										function (err, raw) {}
									);
								}
			                }
						}
		            }
		        }
		    ],
			commands: null
		};

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


		bot.client.on("connecting", function(server, port) {
		    util.log(null, styles.console.info("Connecting to Twitch..."));
		});

		bot.client.on("logon", function() {
			util.log(null, styles.console.info("Logged in."));
		});

		bot.client.on("connected", function(server, port) {
			util.log(null, styles.console.info("Connected to Twitch."));

			for (var i = 0; i < bot.updates.length; i++) {
				var update = bot.updates[i];
			    update.func();
			    update.repeater = setInterval(update.func, update.time);
			}

			var salutations = season.readFileSync(__dirname + '/../options/salutations.cson');

			//Chat listener
			bot.client.addListener('chat', function (channel, user, message) {
				if (user.username != options.twitch.identity.username) {
					user = {
						name: user.username,
						rank: bot.users[user.username]
					};
					if (message[0] == options.core.commandPrefix) {
						if (options.output.messages.showCommandCalls) util.log(user.name, styles.event.command(message));
						message = message.split(' ');
						if (message[0].substring(1) in bot.commands) {
							command = bot.commands[message[0].substring(1)];
							command(user, message.slice(1));
						} else {
							util.log(null, user.name + " tried to run the command '" + message[0].substring(1) + "' but it doesn't exist!");
						}
					} else {
						for (var i = 0; i < options.core.keywords.length; i++) {
							if (message.toLowerCase().search('\\b' + options.core.keywords[i] + '\\b') > -1) {
								util.log(user.name, styles.keyword(message));
								//TODO Growl notification
								return;
							}
						}

					    for (var i = 0; i < salutations.greetings.length; i++) {
					        if (message.toLowerCase().search('\\b' + salutations.greetings[i] + '\\b') > -1) {
					            util.log(user.name, styles.greeting(message));
					            //TODO Growl notification
					            //https://github.com/tj/node-growl
					            //https://github.com/azer/play-audio
					            //http://www.paralint.com/projects/notifu/
					            return;
					        }
					    }

					    for (var i = 0; i < salutations.farewells.length; i++) {
					        if (message.toLowerCase().search('\\b' + salutations.farewells[i] + '\\b') > -1) {
					            util.log(user.name, styles.farewell(message));
					            //TODO Growl notification
					            return;
					        }
					    }

						var style;
						if (user.rank >= ranks.Broadcaster) style = styles.broadcaster;
						else if (user.rank >= ranks.Moderator) style = styles.moderator;
						else style = styles.user;
						util.log(user.name, style(message));
					}
				}
			});
		});

		bot.client.on("disconnected", function(reason) {
			util.log(null, styles.console.info("Disconnected from Twitch."));
		});
	}
});

process.stdin.resume();
var exitHandler = function() {
	util.log(null, styles.console.info("Shutting down..."));
	global.bot.exit();
};
process.on('SIGINT', exitHandler);
process.on('uncaughtException', function (err) {
	if (!global.modules || !global.modules.fs) global.modules = {
		fs: require('fs-extra')
	};
	console.log(err.stack);
	global.modules.fs.writeFileSync("error.log", err.stack);
	process.exit();
});
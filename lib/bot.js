
require('./init.js');

var mongoose = global.modules.mongoose;
var irc = global.modules.irc;
var season = global.modules.season;

var options = global.options;
var util = global.util;
var ranks = global.data.ranks;

// if we can't connect to the database, there's no point in going any farther.
mongoose.connect(options.database.path, function(err) {
	if (err) {
        console.log(styles.console.error(err));
		process.exit();
	} else {
		console.log(styles.console.info('Connection to MongoDB successful.'));

		global.bot = bot = {
			exit: function () {
				this.client.disconnect(); //Stop IRC
	            process.exit(); //Stop node
			},
		    apiData: {},
		    users: {},

		    updates: [
		        { // increment user data
		            time: 60000,
		            func: function () {
		                util.getViewers();
		                util.getAPIData();
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
		bot.client.connect().then(function(status) {
			if (status) {
				console.log(styles.console.info("Connection to Twitch successful."));

				bot.channel = options.twitch.channels[0];

				for (var i = 0; i < bot.updates.length; i++) {
					var update = bot.updates[i];
				    update.func();
				    update.repeater = setInterval(update.func, update.time);
				}

				var salutations = season.readFileSync(__dirname + '/../options/salutations.cson');

				//Chat listener
				bot.client.addListener('chat', function (channel, user, message) {
					user = {
						name: user.username,
						rank: bot.users[user.username]
					};
					if (message[0] == options.core.commandPrefix) {
						if (options.core.logCommandCalls) console.log(styles.event.command(user.name + ": " + message));
						message = message.split(' ');
						if (message[0].substring(1) in bot.commands) {
							command = bot.commands[message[0].substring(1)];
							command(user, message.slice(1));
						} else {
							console.log(user.name + " tried to run the command '" + message[0].substring(1) + "' but it doesn't exist!");
						}
					} else {
					    for (var i = 0; i < salutations.greetings.length; i++) {
					        if (message.toLowerCase().search('\\b' + salutations.greetings[i] + '\\b') > -1) {
					            console.log(styles.greeting(user.name + ": " + message));
					            //TODO Growl notification
					            //https://github.com/tj/node-growl
					            //https://github.com/azer/play-audio
					            //http://www.paralint.com/projects/notifu/
					            return;
					        }
					    }

					    for (var i = 0; i < salutations.farewells.length; i++) {
					        if (message.toLowerCase().search('\\b' + salutations.farewells[i] + '\\b') > -1) {
					            console.log(styles.farewell(user.name + ": " + message));
					            //TODO Growl notification
					            return;
					        }
					    }

						// TODO implement keyword detection

						var style;
						if (user.rank >= ranks.Broadcaster) style = styles.broadcaster;
						else if (user.rank >= ranks.Moderator) style = styles.moderator;
						else style = styles.user;
						console.log(style(user.name + ": " + message));
					}
				});
			} else {
				console.log(styles.console.error("I couldn't connect to twitch. =("));
			}
		});
	}
});

process.stdin.resume();
var exitHandler = function() {
	console.log(styles.console.info("Shutting down..."));
	global.bot.exit();
};
process.on('SIGINT', exitHandler);
process.on('uncaughtException', function () {
	console.log(arguments);
});
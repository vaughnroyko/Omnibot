
var irc = require('twitch-irc');
var api = require('twitch-irc-api');
var request = require('request');
var chalk = require('chalk');
var mongoose = require('mongoose');
var season = require('season');
var _ = require('underscore-plus');

global.modules = {
	irc: irc,
	api: api,
	request: request,
	chalk: chalk,
	mongoose: mongoose,
	season: season,
	underscorePlus: _
};

var options = global.options = {
	core: season.readFileSync(__dirname + '/../options/core.cson'),
	database: season.readFileSync(__dirname + '/../options/database.cson'),
	twitch: season.readFileSync(__dirname + '/../options/twitch.cson')
};

var ranks = season.readFileSync(__dirname + '/util/ranks.cson');
global.data = {
	ranks: ranks
};

var createStyle = function (cur, def) {
	if (def[0] == "#") {
		if (def.substring(1) in cur) {
			return cur[def.substring(1)];
		} else {
			return null;
		}
	} else {
		var result = chalk;
		def = def.split('.');
		for (var i = 0; i < def.length; i++) {
			result = result[def[i]];
		}
		return result;
	}
}
var createStyles = function (defs) {
	var result = {};
	for (var styleName in defs) {
		if (typeof defs[styleName] == "string") {
			var style = createStyle(result, defs[styleName]);
			if (style !== null) result[styleName] = style;
			else style = chalk.white;
		} else {
			result[styleName] = createStyles(defs[styleName]);
		}
	}
	return result;
}

var styles = global.styles = createStyles(options.core.styles);

//Init DB
mongoose.connect(global.options.database.path, function(err) {
	if (err) {
        console.log(styles.console.error(err));
	} else {
		console.log(styles.console.info('Connection to MongoDB successful.'));

		var util = global.util = require('./util/misc.js');

		global.bot = bot = {
		    clientOptions: global.options.twitch,
			database: {
				users: mongoose.model('users', mongoose.Schema({
			    	username: String,
			        points: Number,
			    	time: Number,
			        items: [Number],
			        firstjoin: Date
			    })),
				quotes: mongoose.model('quotes', mongoose.Schema({
			    	quote: String,
			        username: String,
			        added: Date
			    }))
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
				                    bot.database.users.update(
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
			commands: require('./commands.js')
		};
		bot.client = new irc.client(bot.clientOptions);
		bot.client.connect().then(function(status) {
			if (status) {
				console.log(styles.console.info("Connection to Twitch successful."));

				bot.channel = bot.clientOptions.channels[0];

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
					if (message[0] == "!") {
						message = message.split(' ');
						if (message[0].substring(1) in bot.commands) {
							command = bot.commands[message[0].substring(1)];
							command(user, message.slice(1));
						} else {
							// command was not found!
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

						var style;
						if (user.rank >= ranks.Broadcaster) style = styles.broadcaster;
						else if (user.rank >= ranks.Moderator) style = styles.moderator;
						else style = styles.viewer;
						console.log(style(user.name + ": " + message));
					}
				});
			} else {
				console.log(styles.console.error("I couldn't connect to twitch. =("));
			}
		});
	}
});
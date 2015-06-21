
var irc = require('twitch-irc');
var api = require('twitch-irc-api');
var request = require('request');
var chalk = require('chalk');
var mongoose = require('mongoose');
var season = require('season');

global.modules = {
	irc: irc,
	api: api,
	request: request,
	chalk: chalk,
	mongoose: mongoose,
	season: season
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

//Init DB
mongoose.connect(global.options.database.path, function(err) {
	if (err) {
        console.log(chalk.red(err));
	} else {
		console.log('Connection to MongoDB successful.');

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
						if (util.isLive) {
			                for (var user in bot.users) {
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
		    ],
			commands: require('./commands.js')
		};
		bot.client = new irc.client(bot.clientOptions);
		bot.client.connect();
		bot.channel = bot.clientOptions.channels[0];

		util.host = bot;

		for (var i = 0; i < bot.updates.length; i++) {
			var update = bot.updates[i];
		    update.func();
		    update.repeater = setInterval(update.func, update.time);
		}

		var salutations = require('./salutations.js');

		//Chat listener
		bot.client.addListener('chat', function (channel, user, message) {
			user = {
				name: user.username,
				rank: bot.users[user.username]
			};
			if (message[0] == "!") {
				message = message.split(' ');
				command = bot.commands[message[0].substring(1)];
				command(user, message.slice(1));
			} else {
			    for (var i = 0; i < salutations.greetings.length; i++) {
			        if (message.toLowerCase().search('\\b' + salutations.greetings[i] + '\\b') > -1) {
			            console.log(chalk.bold.magenta.underline(user.name + ": " + message));
			            //TODO Growl notification
			            //https://github.com/tj/node-growl
			            //https://github.com/azer/play-audio
			            //http://www.paralint.com/projects/notifu/
			            return;
			        }
			    }

			    for (var i = 0; i < salutations.farewells.length; i++) {
			        if (message.toLowerCase().search('\\b' + salutations.farewells[i] + '\\b') > -1) {
			            console.log(chalk.bold.magenta.underline(user.name + ": " + message));
			            //TODO Growl notification
			            return;
			        }
			    }

			    console.log(chalk.white(user.name + ": " + message));
			}
		});
	}
});
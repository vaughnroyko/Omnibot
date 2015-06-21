var irc = require('twitch-irc');
var chalk = require('chalk');
var mongoose = require('mongoose');
var dbOptions = require('./database-options.js');

//Init DB
mongoose.connect(dbOptions.path, function(err) {
	if (err) {
        console.log(chalk.red(err));
	} else {
		console.log('Connection to MongoDB successful.');
	}
});

var util = require('./util/misc.js');
var userType = require('./util/userType.js');

var options = require('./bot-options.js');

var bot = {
    clientOptions: require('./client-options.js'),
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
                for (var user in bot.users) {
                    bot.database.users.update({username: user}, { $inc: { points: 1, time: 1 } }, { multi: true }, function (err, raw) {});
                }
            }
        }
    ],
	commands: {
		top: function (user, params) {
			var count = params[0] > 0 ? Math.min(params[0], 10) : options.defaultListSize;
			bot.database.users.find().sort({points: -1}).limit(count).exec(function(err, docs) {
				var output = "Top " + count + ": ";
				if (docs) {
					for (var i = 0; i < docs.length; i++) {
						output += docs[i].username + ": " + docs[i].points + " | ";
					}
					output = output.substring(0, output.length - 3);
					util.say(output);
				} else {
					util.say(chalk.red("Something went wrong."));
				}
			});
		},
		balance: function (user, params) {
			bot.database.users.findOne({username: user.username}, function(err, docs) {
				if (docs) {
					util.say('You have ' + docs.points + ' points, ' + user.username + '!');
				} else {
					util.say("Your amount of points exceeds the limits of my computational power.");
				}
			});
		},
		stop: function (user, params) {
			//Mods and broadcaster can stop the bot
			if (util.isMod(user.username)) {
				util.say('#REKT');
				console.log(chalk.red(user.username + ' stopped the bot!'));
				bot.client.disconnect(); //Stop IRC
				process.exit(); //Stop node
			}
		},
		uptime: function (user, params) {
			var started = new Date(bot.apiData.stream.created_at);
			var now = new Date();
			var uptime = now - started;
			var hours = Math.floor((uptime % 86400000) / 3600000);
			var minutes = Math.floor(((uptime % 86400000) % 3600000) / 60000);
			util.say(bot.channel + ' has been streaming for ' + hours + ' hours and ' + minutes + ' minutes!');
			// todo make it say prettier
		},
		quote: function (user, params) {
		    var params = message.split(' ');
		    var quoteUser = params[1].toLowerCase();
		    var quoteMsg = params.slice(2).join(' ');
		    // Do something
		    bot.database.users.findOne({username: user.username, time: { $gt: 100 }}, function(err, docs) {
		        //Only allow people with certain time, or me, or mode to add quotes
		        if (docs || util.isMod(user.username)) {
		            bot.database.users.findOne({username: quoteUser}, function(err, docs) {
		                if (docs) {
		                    var now = new Date();
		                    //TODO doesn't work?
		                    bot.database.quotes.insert({username: quoteUser, quote: quoteMsg, added: now});
		                    util.say('Quote has been added for ' + quoteUser + '!');
		                } else {
		                    util.say(quoteUser + ' does not exist!');
		                }
		            });
		        }
		    });
		},
		recite: function (user, params) {
	        //TODO fix, map/toArray not working - we shouldn't need array/map here
	        var rand = Math.floor(Math.random() * bot.database.quotes.count());
	        bot.database.quotes.find().limit(-1).skip(rand).next().toArray().map(function(doc) {
	            util.say(doc.username + ': ' + doc.quote);
	        });
		}
	}
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
	if (message[0] == "!") {
		message = message.split(' ');
		command = bot.commands[message[0].substring(1)];
		command(user, message.slice(1));
	} else {
	    for (var i = 0; i < salutations.greetings.length; i++) {
	        if (message.toLowerCase().search('\\b' + salutations.greetings[i] + '\\b') > -1) {
	            console.log(chalk.bold.magenta.underline(user.username + ": " + message));
	            //TODO Growl notification
	            //https://github.com/tj/node-growl
	            //https://github.com/azer/play-audio
	            //http://www.paralint.com/projects/notifu/
	            return;
	        }
	    }

	    for (var i = 0; i < salutations.farewells.length; i++) {
	        if (message.toLowerCase().search('\\b' + salutations.farewells[i] + '\\b') > -1) {
	            console.log(chalk.bold.magenta.underline(user.username + ": " + message));
	            //TODO Growl notification
	            return;
	        }
	    }

	    console.log(chalk.white(user.username + ": " + message));
	}
});

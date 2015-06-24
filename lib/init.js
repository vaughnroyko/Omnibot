
// load all node modules
global.modules = {
	irc: require('twitch-irc'),
	api: require('twitch-irc-api'),
	request: require('request'),
	chalk: require('chalk'),
	mongoose: require('mongoose'),
	season: require('season'),
	underscorePlus: require('underscore-plus'),
	fs: require('fs')
};

var mongoose = global.modules.mongoose;
var season = global.modules.season;

// set up collections that should be in the database
global.database = {
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
	})),
	commands: mongoose.model('commands', mongoose.Schema({
		name: String,
		rank: Number,
		output: String
	}))
};

global.options = {
	core: season.readFileSync(__dirname + '/../options/core.cson'),
	database: season.readFileSync(__dirname + '/../options/database.cson'),
	twitch: season.readFileSync(__dirname + '/../options/twitch.cson'),
	output: season.readFileSync(__dirname + '/../options/output.cson'),
	styles: season.readFileSync(__dirname + '/../options/styles.cson')
};

global.options.twitch.identity.username = global.options.twitch.identity.username.toLowerCase();

for (var i = 0; i < global.options.twitch.channels.length; i++) {
	global.options.twitch.channels[i] = global.options.twitch.channels[i].toLowerCase();
}

global.data = {
	ranks: season.readFileSync(__dirname + '/util/ranks.cson')
};

global.styles = require('./util/styles.js')(options.styles);

global.util = require('./util/misc.js');
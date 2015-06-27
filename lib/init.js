
// load all node modules
global.modules = {
	irc: require('twitch-irc'),
	request: require('request'),
	chalk: require('chalk'),
	mongoose: require('mongoose'),
	season: require('season'),
	underscorePlus: require('underscore-plus'),
	fs: require('fs-extra')
};

var mongoose = global.modules.mongoose;
var season = global.modules.season;
var fs = global.modules.fs;

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

require("./util/str.js");

try {
	fs.mkdirSync("logs");
} catch (err) {
	if (err.code != "EEXIST") throw err;
}
if (fs.existsSync("bot.log")) {
	fs.renameSync("bot.log", "logs/" + function() {
		var t = new Date(fs.statSync("bot.log").mtime);
		return "{0}-{1}-{2}.{3}-{4}-{5}".format(
			t.getFullYear(),
			(t.getMonth() + 1).toString().padLeft(2, '0'),
			t.getDate().toString().padLeft(2, '0'),
			t.getHours().toString().padLeft(2, '0'),
			t.getMinutes().toString().padLeft(2, '0'),
			t.getSeconds().toString().padLeft(2, '0')
		);
	}() + ".log");
}

var optionsFolder = __dirname + "/../options/";
var optionFiles = fs.readdirSync(optionsFolder + "defaults");
for (var i = 0; i < optionFiles.length; i++) {
	if (!fs.existsSync(optionsFolder + optionFiles[i])) {
		fs.copySync(optionsFolder + "defaults/" + optionFiles[i], optionsFolder + optionFiles[i]);
	}
}


global.options = {};

for (var i = 0; i < optionFiles.length; i++) {
	global.options[optionFiles[i].split(/\./).shift()] = season.readFileSync(optionsFolder + optionFiles[i]);
}

global.options.twitch.identity.username = global.options.twitch.identity.username.toLowerCase();

for (var i = 0; i < global.options.twitch.channels.length; i++) {
	global.options.twitch.channels[i] = global.options.twitch.channels[i].toLowerCase();
}

global.data = {
	ranks: season.readFileSync(__dirname + '/util/ranks.cson')
};

global.styles = require('./util/styles.js')(options.styles);

global.util = require('./util/misc.js');
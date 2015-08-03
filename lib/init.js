
// load all node modules
global.modules = {
	irc: require('tmi.js'),
	request: require('request'),
	chalk: require('chalk'),
	mongoose: require('mongoose'),
	season: require('season'),
	underscorePlus: require('underscore-plus'),
	fs: require('fs-extra'),
	sync: require('synchronicity'),
	jsonc: require('circular-json')
};

var mongoose = global.modules.mongoose;
var season = global.modules.season;
var fs = global.modules.fs;

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
	if (global.options.twitch.channels[i][0] == "#") {
		global.options.twitch.channels[i] = global.options.twitch.channels[i].substring(1);
	}
}

// set up collections that should be in the database
global.database = {
	users: mongoose.model(global.options.twitch.channels[0] + '.users', mongoose.Schema({
		name: String,
		time: Number,
		create: Date,
		rank: Number,
		chatting: Boolean
	}))
};


global.data = {
	ranks: season.readFileSync(__dirname + '/util/ranks.cson')
};


global.util = require('./util/misc.js');
global.util.styler = require('./util/styles.js');
global.styles = global.util.styler.process(options.styles);
global.util.viewers = require('./util/viewers.js');
global.util.chatter = require('./util/chatter.js');
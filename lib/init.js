
// load all node modules
global.modules = {
	irc: require('tmi.js'),
	request: require('request'),
	chalk: require('chalk'),
	mongoose: require('mongoose'),
	season: require('season'),
	underscore: require('underscore-plus'),
	fs: require('fs-extra'),
	sync: require('synchronicity'),
	path: require("path")
};

var mongoose = global.modules.mongoose;
var season = global.modules.season;
var fs = global.modules.fs;
var _ = global.modules.underscore;
var path = global.modules.path;

require("./util/str.js");

var optionsFolder = __dirname + "/../options/";
var optionFiles = fs.readdirSync(optionsFolder + "defaults");

var loadOptions = function (folder) {
	var result = {};
	for (var i = 0; i < optionFiles.length; i++) {
		result[optionFiles[i].split(/\./).shift()] = season.readFileSync(path.join(folder, optionFiles[i]));
	}
	return result;
}

var defaultOptions = loadOptions(optionsFolder + "defaults");

for (var i = 0; i < optionFiles.length; i++) {
	if (!fs.existsSync(optionsFolder + optionFiles[i])) {
		fs.writeFileSync(optionsFolder + optionFiles[i], "");
	}
}

global.options = process.argv.indexOf("-defaults") == -1 ?(
	_.deepExtend({}, defaultOptions, loadOptions(optionsFolder))
): ( defaultOptions );

global.options.twitch.identity.username = global.options.twitch.identity.username.toLowerCase();

global.options.twitch.channels[0] = global.options.twitch.channels[0].toLowerCase();
if (global.options.twitch.channels[0][0] == "#") {
	global.options.twitch.channels[0] = global.options.twitch.channels[0].substring(1);
}

for (var i = 0; i < global.options.core.blacklist.length; i++) {
	global.options.core.blacklist[i] = global.options.core.blacklist[i].toLowerCase();
}
global.options.core.blacklist.push(global.options.twitch.channels[0], global.options.twitch.identity.username);

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
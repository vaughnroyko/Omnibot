
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

mongoose.Document.prototype.edit = function (data, callback) {
	this.constructor.update({_id: this._id}, data, function () { if (typeof callback == "function") callback.apply(null, arguments); });
};

global.debug = {
	isLive: false
};

try {
	global.debug = _.deepExtend(global.debug, season.readFileSync("lib/debug.cson"));
} catch (err) {
	if (err.code != "ENOENT") throw err;
}

var exiting = false;
var exit = function (code) {
	if (typeof global.util != "undefined" && typeof global.util.chatter != "undefined") global.util.chatter.print(global.styles.console.info("Shutting down..."));
	else console.log("Shutting down...");
	exiting = true;
	if (global.bot) global.bot.exit();
	else process.exit(code === undefined ? (global.bot ? global.bot.exitCode : 1) : code);
};


try {
	fs.mkdirpSync("logs/last");
} catch (err) {
	if (err.code != "EEXIST") throw err;
}

if (global.modules.fs.existsSync("logs/last/error.log")) global.modules.fs.unlinkSync("logs/last/error.log");
if (global.modules.fs.existsSync("logs/last/debug.log")) global.modules.fs.unlinkSync("logs/last/debug.log");

process.stdin.resume();
process.on('SIGINT', exit);
process.on('exit', function (code) {
	if (!exiting) exit(code);
});
process.on('uncaughtException', function (err) {
	if (!global.modules || !global.modules.fs) global.modules = {
		fs: require('fs-extra')
	};
	if (!global.options || global.options.output.exceptions) console.log(err.stack);
	global.modules.fs.writeFileSync("logs/last/error.log", err.stack);
	process.exit(1);
});

require("weaving").applyProtos(true);

var optionsFolder = __dirname + "/../options/";
var optionFiles = fs.readdirSync(optionsFolder + "defaults");

var loadOptions = function (folder) {
	var result = {};
	for (var i = 0; i < optionFiles.length; i++) {
		var file = path.join(folder, optionFiles[i]);
		if (!fs.existsSync(file)) fs.writeFileSync(file, "");
		var obj = season.readFileSync(file);
		if (obj) result[optionFiles[i].split(".").shift()] = obj;
	}
	return result;
}

var defaultOptions = loadOptions(optionsFolder + "defaults");

var ConfigError = Error.create("ConfigError", "Please {1?correct:fill out} the file '{0}'");

global.options = process.argv.indexOf("-defaults") == -1 ?(
	_.deepExtend({}, defaultOptions, loadOptions(optionsFolder))
): ( defaultOptions );

if (global.options.twitch.identity.username + global.options.twitch.identity.password + global.options.twitch.channel == "") {
	throw new ConfigError("options/twitch.cson");
} else {
	global.options.twitch.identity.username = global.options.twitch.identity.username.toLowerCase();

	global.options.twitch.channel = global.options.twitch.channel.toLowerCase();
	if (global.options.twitch.channel[0] == "#") {
		global.options.twitch.channel = global.options.twitch.channel.substring(1);
	}

	for (var i = 0; i < global.options.core.blacklist.length; i++) {
		global.options.core.blacklist[i] = global.options.core.blacklist[i].toLowerCase();
	}
	global.options.core.blacklist.push(global.options.twitch.channel, global.options.twitch.identity.username);

	// set up collections that should be in the database
	global.database = {
		users: mongoose.model(global.options.twitch.channel + '.users', mongoose.Schema({
			name: String,
			time: Number,
			create: Date,
			rank: Number,
			chatting: Boolean,
			displayName: String
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
}
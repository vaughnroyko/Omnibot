// variable pre-initialization (so it doesn't error when trying to use them before they're defined)

var fs, logger, database;


// set up process basics

(function () {
    var exit = process.exit.bind(process, 1);

    process.stdin.resume();
    process.on('SIGINT', exit);

    var timeout = function (time, callback) {
        if (typeof time == "number" && typeof callback == "function") timeout.time = time, timeout.callback = callback;
        else {
            if (timeout.time == 0) timeout.callback();
        }
        timeout.time -= 1;
        setTimeout(timeout, 1000);
    };

    process.on('uncaughtException', function (err) {
        console.log(err.stack);
        try {
            if (typeof logger == "object") logger.logTo("error.log", err.stack);
        } catch (err) {
            console.log("Issue using logger.");
        }
        timeout(5, exit);
    });
})();


// load needed modules

var tmijs = require("tmi.js");
require("weaving").applyProtos(true);

global.packages = {};


// load core library

fs = global.packages.fs = require("./core/fs.js");

logger = new (require("./core/logger.js"))("logs");
logger.selected = "bot.log";

database = require("./core/database.js");


// load debug options

var debug = {
	isLive: false
};
fs.readFileThenSync("lib/debug.cson", function (contents) {
    debug = _.deepExtend(debug, contents);
});


// load other options

var OptionManager = new (require("./core/options.js"))("options"),
    options = process.argv.indexOf("-defaults") == -1 ? OptionManager.load() : OptionManager.defaults;

var ConfigError = Error.create("ConfigError", "Please {1?correct:fill out} the file '{0}'");

if ("" in [options.twitch.identity.username, options.twitch.identity.password, options.twitch.channel]) {
    throw new ConfigError("options/twitch.cson");
} else {
    options.twitch.identity.username = options.twitch.identity.username.toLowerCase();

    options.twitch.channel = options.twitch.channel.toLowerCase();
    if (options.twitch.channel[0] == "#") options.twitch.channel = options.twitch.channel.substring(1);

    for (var i = 0; i < options.core.blacklist.length; i++)
        options.core.blacklist[i] = options.core.blacklist[i].toLowerCase();

    options.core.blacklist.push(options.twitch.channel, options.twitch.identity.username);
}

// bot START!


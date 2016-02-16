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

var _ = require("underscore-plus");
require("weaving").applyProtos(true);


// load core library

fs = global.fs = require("./core/fs.js");

logger = global.logger = new (require("./core/logger.js"))("logs");
logger.selected = "bot.log";



// load debug options

var debug = {
	isLive: false
};
fs.tryReadSync("lib/debug.cson", function (contents) {
    debug = _.deepExtend(debug, contents);
});


// load other options

var OptionManager = new (require("./core/options.js"))("options"),
    options = process.argv.indexOf("-defaults") == -1 ? OptionManager.load() : OptionManager.defaults;

var ConfigError = Error.create("ConfigError", "Please {1?correct:fill out} the file '{0}'");

if ("" in [options.twitch.identity.username, options.twitch.identity.password, options.twitch.channel])
    throw new ConfigError("options/twitch.cson");

options.twitch.identity.username = options.twitch.identity.username.toLowerCase();

if (options.twitch.channel[0] == "#") options.twitch.channel = options.twitch.channel.substring(1);
options.twitch.channel = options.twitch.channel.toLowerCase();

for (var i = 0; i < options.core.blacklist.length; i++)
    options.core.blacklist[i] = options.core.blacklist[i].toLowerCase();

options.core.blacklist.push(options.twitch.channel, options.twitch.identity.username);


// bot START!

var client = new (require("./core/client.js"))(options.twitch);

console.log(client.on.action);

client.events({
    chat: function () {
        console.log("hi", arguments);
    }
});

client.connect();
// variable pre-initialization (so it doesn't error when trying to use them before they're defined)

var bot = {}, fs,
    Logger, logger,
    database,
    commands,
    optionManager, options,
    Client, client;

// set up process basics
require("./util/process.js");
process.onError = function (err) {
    var success = false;
    try {
        if (typeof logger == "object") {
            logger.timestamp = false;
            logger.logTo("error.log", err.stack);
            success = true;
        }
    } catch (_e) {}
    if (!success) {
        console.log("Issue using logger.");
        console.log(err.stack);
    }
    return success;
};

// load needed modules

var _ = require("underscore-plus");
var weaving = require("weaving");
weaving.library.add(require("weaving-chalk"));
weaving.applyProtos(true);

require("./util/misc.js");

// load core library

fs = global.fs = require("./util/fs.js");
database = require("./util/database.js");
Logger = require("./core/logger.js");
logger = bot.logger = global.logger = new Logger("logs");


// load debug options

var debug = {
	isLive: false
};
fs.tryReadSync("lib/debug.cson", function (contents) {
    debug = _.deepExtend(debug, contents);
});


// load other options

OptionManager = require("./core/options.js"),
optionManager = new OptionManager("options"),
options = bot.options = process.argv.indexOf("-defaults") == -1 ? optionManager.load() : optionManager.defaults;

var ConfigError = Error.create("ConfigError", "Please {1?correct:fill out} the file '{0}'");

if ([options.twitch.identity.username, options.twitch.identity.password, options.twitch.channel].includes(""))
    throw new ConfigError("options/twitch.cson");

options.twitch.identity.username = options.twitch.identity.username.toLowerCase();

if (options.twitch.channel[0] == "#") options.twitch.channel = options.twitch.channel.substring(1);
options.twitch.channel = options.twitch.channel.toLowerCase();

for (var i = 0; i < options.core.blacklist.length; i++)
    options.core.blacklist[i] = options.core.blacklist[i].toLowerCase();

options.core.blacklist.push(options.twitch.channel, options.twitch.identity.username);


// bot START!

logger.selected = "bot.log",
logger.timestamp = true,
logger.timestampFormat = options.output.timestamp;

bot.stop = process.exit,
bot.restart = process.exit.bind(process, 4);

bot.channel = options.twitch.channel,
bot.identity = options.twitch.identity.username;


// if we can't connect to the database, there's no point in going any farther.
try {
    database.connect(options.mongo.path, options.mongo.connection);
} catch (err) {
    logger.timestamp = false;
    logger.log(
        (err.name == "MongoError" && err.message.startsWith("connect ECONNREFUSED") ? (
            "{#red:Couldn't connect to MongoDB.}"
        ):(
            "{#red:{name}: {message}\n{1}}"
        )).weave(err, Error.trim(err.stack))
    );
    process.exit(1);
}
bot.database = new database("omnibot.v1#" + bot.channel);

Client = require("./core/client.js"),
client = bot.client = new Client(options.twitch);

chatters = bot.chatters = require("./core/chatters.js")(bot);
commands = bot.commands = require("./core/commands.js")(bot);


client.on("chat", function (userData, message) {
    var chatter = chatters.get(userData);
    logger.log(chatter.displayName + ": " + message);
    if (message[0] == "!") {
        // TODO @stats -> command
        var result = commands.call(message.slice(1), chatter);
        if (!result.success) {
            // TODO @stats -> command failure
            switch (options.output.commandFails) {
                case "whisper": {

                    break;
                }
                case "global": {

                    break;
                }
            }
        }
    } else {
        // TODO @stats -> message
    }
});
client.on("action", function (userData, message) {
    logger.log(userData['display-name'] + " " + message);
});

console.lockInput();

logger.log("Connecting to twitch...");
client.connectSync();
logger.log("Connected! Channel: #" + client.channel);

// TODO @stats -> started

// variable pre-initialization (so it doesn't error when trying to use them before they're defined)
import { Process, Arguments, Console, Timeline } from "consolemate";

import { Logger } from "./core/Logger";
var logger: Logger;
import { Database } from "./util/database";
var database: Database;
import { Options as OptionManager } from "./util/options";
var optionManager: OptionManager;


// set up the process basics--consolemate, arguments, etc

Process.on.error("logger", function (err: Error) {
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
});


Console.input.advanced(true);
Console.clear();


var argReader = new Arguments.Reader;
argReader.flagAliases = {
    "developer|dev|d": "developer",
    "channel": "twitch.channel > 1"
};
argReader.throwIfArgumentsIncorrect = true;

var { options, flags, args } = argReader.read();

Console.logLine(options, flags, args);

// load needed modules

//var _ = require("underscore-plus");
import {weaving, StringUtils} from "weaving";
weaving.library.add(require("weaving-chalk"));

// load other options

optionManager = new OptionManager("options"),
options = (
    flags.has("defaults") ? optionManager.defaults : optionManager.load()
);

class ConfigError extends weaving.Error {
    protected _name = 'ConfigError';
    protected _message = "Please {1?correct:fill out} the file '{0}'";
}

if ([options.twitch.identity.username, options.twitch.identity.password, options.twitch.channel].includes(""))
    throw new ConfigError("options/twitch.cson");

options.twitch.identity.username = options.twitch.identity.username.toLowerCase();

if (options.twitch.channel[0] == "#") options.twitch.channel = options.twitch.channel.substring(1);
options.twitch.channel = options.twitch.channel.toLowerCase();

for (var i = 0; i < options.core.blacklist.length; i++)
    options.core.blacklist[i] = options.core.blacklist[i].toLowerCase();

options.core.blacklist.push(options.twitch.channel, options.twitch.identity.username);


// load core library

database = new Database(options.channel);
logger = new Logger("logs");


Console.input.enable();
Console.onLine = function (line: string) {
    
};
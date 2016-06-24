/// <reference path="../node_modules/weaving/typings/String-all.d.ts" />

// variable pre-initialization (so it doesn't error when trying to use them before they're defined)
import { Process, Arguments, Timeline } from "consolemate";
Process.connect();

import { Bot } from "./core/Bot";
var bot: Bot;

import { Options as OptionManager } from "./util/options";
var optionManager: OptionManager;


// set up the process basics--consolemate, arguments, etc

Process.on.error("logger", function (err: Error) {
    var success = false;
    try {
        if (typeof bot.logger == "object") {
            bot.logger.timestamp = false;
            bot.logger.logTo("error.log", err.stack);
            success = true;
        }
    } catch (_e) {}
    if (!success) {
        console.log("Issue using logger.");
        console.log(err.stack);
    }
    return success;
});




var argReader = new Arguments.Reader;
argReader.flagAliases = {
    "developer|dev|d": "developer",
    "channel": "twitch.channel > 1"
};
argReader.throwIfArgumentsIncorrect = true;

var options: any;
var { options: o, flags, args } = argReader.read();
options = o;

// load needed modules

//var _ = require("underscore-plus");
import weaving = require("weaving");
var StringUtils = weaving.StringUtils;

weaving.library.add(require("weaving-chalk"));

var applyPrototypes = function (obj: any, target: Function) {
    for (var fname in obj) {
        obj[fname].applyTo(fname, target);
    }
}
applyPrototypes(StringUtils, String);
applyPrototypes(StringUtils, String);
applyPrototypes({ weave: weaving.weave, weaveIgnore: weaving.weaveIgnore }, String);

// load other options

optionManager = new OptionManager("options"),
options = (
    flags.has("defaults") ? optionManager.defaults : optionManager.load()
);

class ConfigError extends weaving.Error {
    name = 'ConfigError';
    message = "Please {1?correct:fill out} the file '{0}'";
}

if ([options.twitch.identity.username, options.twitch.identity.password, options.twitch.channel].includes(""))
    throw new ConfigError("options/twitch.cson");

options.twitch.identity.username = options.twitch.identity.username.toLowerCase();

if (options.twitch.channel[0] == "#") options.twitch.channel = options.twitch.channel.substring(1);
options.twitch.channel = options.twitch.channel.toLowerCase();

for (var i = 0; i < options.core.blacklist.length; i++)
    options.core.blacklist[i] = options.core.blacklist[i].toLowerCase();

options.core.blacklist.push(options.twitch.channel, options.twitch.identity.username);

bot = new Bot(options);

bot.connect();
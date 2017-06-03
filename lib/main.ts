// letiable pre-initialization (so it doesn't error when trying to use them before they're defined)

import { Process, Arguments, Console, Timeline } from "consolemate";
Process.connect();

import { Bot } from "./core/Bot";
let bot: Bot;

import { Options as OptionManager } from "./util/options";
let optionManager: OptionManager;


// set up the process basics--consolemate, arguments, etc

Process.on.error("logger", function (err: Error) {
	let success = false;
	try {
		if (typeof bot.logger == "object") {
			bot.logger.withTimestamp(() => {
				bot.logger.logTo("error.log", err.stack);
				success = true;
			}, false);
		}
	} catch (_e) { }
	function callback () {
		if (bot) bot.stop();
		else Process.exit();
	}
	if (success) {
	} else {
		console.log("Issue using logger.");
		console.log(err.stack);
	}
	Console.logLine("\nPress any key to exit...");
	Console.init();
	Timeline.clearSchedule();
	Console.input.clearCharHandlers();
	Console.input.clearLineHandlers();
	Console.input.setRecieveChars(true);
	Console.input.onChar(callback);
	Console.input.enable();
	return success;
});


const argReader = new Arguments.Reader({
	options: [
		{
			name: "developer",
			type: Arguments.Type.Flag,
			match: /^(developer|devmode|dev|dm)$/,
		},
		{
			name: "channel",
			type: Arguments.Type.Option,
			match: /^(channel|c)$/,
			value: Arguments.ValueType.String,
		},
		{
			name: "defaultOptions",
			type: Arguments.Type.Flag,
			match: /^(default-options|defaults|d)$/,
		},
	],
});
argReader.throwIfArgumentsIncorrect = true;

let options: any;
const { options: o, flags, args } = argReader.read();
options = o;



// load needed modules

import { Weaver, Error as WeavingError } from "weaving";
import WeavingChalk from "weaving-chalk";

const weaver = new Weaver();
weaver.addLibrary(WeavingChalk);

declare global {
	interface String {
		weave (...using: any[]): string;
	}
}
String.prototype.weave = function (...using: any[]) {
	return weaver.weave(this, ...using);
};


// load other options

optionManager = new OptionManager("options");
options = flags["defaults"] ? optionManager.defaults : optionManager.load();

class ConfigError extends WeavingError {
	name = "ConfigError";
	weavingMessage = "Please {1?correct:fill out} the file '{0}'";
	proto = true;
}

if ([options.twitch.identity.username, options.twitch.identity.password, options.twitch.channel].includes(""))
	throw new ConfigError("options/twitch.cson");

options.twitch.identity.username = options.twitch.identity.username.toLowerCase();

if (options.twitch.channel[0] == "#") options.twitch.channel = options.twitch.channel.substring(1);
options.twitch.channel = options.twitch.channel.toLowerCase();

for (let i = 0; i < options.core.blacklist.length; i++)
	options.core.blacklist[i] = options.core.blacklist[i].toLowerCase();

options.core.blacklist.push(options.twitch.channel, options.twitch.identity.username);

// separate the twitch options
const connectionOptions = options.twitch.identity;
options.twitch.identity = options.twitch.identity.username;

bot = new Bot(options);
bot.connect(connectionOptions);
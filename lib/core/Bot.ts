// load modules
import weaving = require("weaving");

import { Console, Process, Timeline } from "consolemate";
import { Database, Collection } from "typego";

// init modules
Console.init();
Console.input.advanced(true);
Console.clear();

console.log = Console.logLine;

// load modules from the bot
import { Logger } from "./Logger";

import { Chat, Chatter, UserData } from "./Chat";
import { Commands } from "./Commands";

import { PluginManager, PluginWrapper as Plugin } from "./Plugins";
import { PluginAPI } from "./support/PluginAPI";

import Ranks = require("./support/Ranks");

import { Channel } from "./support/Channel";

import Options = require("./support/Options");

// configuration
let databaseVersion = "1";

// the bot!
export class Bot {
    identity: string;

    logger: Logger;
    database: Database;

    chat: Chat;
    commands: Commands;
    plugins: PluginManager;

    _updateLoop: Timeline.LoopHandle;

    channel: Channel;

    get isLive () { return this.channel.live; }
    get uptime () { return Date.now() - this.channel.stream.start.getTime(); }

    constructor (public options: Options) {
        this.logger = new Logger("logs");

        this.logger.selected = "bot.log";
        this.logger.timestamp = true;
        this.logger.timestampFormat = this.options.output.timestamp;

        this.channel = new Channel(options.twitch.channel, this.logger, options);
        this.identity = options.twitch.identity;
    }

    say (...what: any[]) {
        this.chat.say(...what);
    }
    whisper (to: string, ...what: any[]) {
        this.chat.whisper(to, ...what);
    }
    stop () {
        Process.exit();
    }
    restart () {
        Process.exit(4);
    }

    runCommand (user: Chatter, input: string) {
        // TODO @stats -> command
        let result = this.commands.call(input, user);
        if (!result.success) {
            // TODO @stats -> command failure
            switch (this.options.output.commands.failure) {
                case "whisper": {
                    // whisper the failure message to the executing user
                    break;
                }
                case "global": {
                    // alert the whole chat to the command failure
                    break;
                }
            }
        }
    }

    connect (connectionOptions: { username: string, password: string }) {

        // connect to the database

        try {
            this.database = new Database(this.options.mongo.path + "V" + databaseVersion + "#" + this.channel.name);
        } catch (err) {
            // if we can't connect to the database, there's no point in going any farther
            this.logger.timestamp = false;
            this.logger.log(
                (err.name == "MongoError" && err.message.startsWith("connect ECONNREFUSED") ? (
                    "{#red:Couldn't connect to MongoDB.}"
                ):(
                    "{#red:{name}: {message}\n{1}}"
                )).weave(err, weaving.trimError(err.stack))
            );
            Timeline.after(5, () => {
                this.stop();
            });
            return;
        }


        // connect to twitch 
        this.chat = new Chat(this.database, () => this.channel.live);

        // initiate the command library
        this.commands = new Commands(this.chat);
        this.commands.add({
            stop: {
                rank: Ranks.admin,
                call: () => {
                    this.say("Shutting down.. Bye guys... ;-;");
                    this.stop();
                }
            },
            restart: {
                rank: Ranks.admin,
                call: () => {
                    this.say("brbz");
                    this.restart();
                }
            },
            noah: {
                call: () => {
                    this.say("wow");
                }
            },
            status: {
                call: (caller: Chatter) => {
                    this.chat.reply(caller, this.channel.status);
                }
            },
            uptime: {
                call: (caller: Chatter) => {
                    let channel = this.channel.name;
                    let uptime = output.commands.uptime;
                    if (this.channel.live) {
                        let hours = Math.floor((this.uptime % 86400000) / 3600000);
                        let minutes = Math.floor(((this.uptime % 86400000) % 3600000) / 60000);
                        this.chat.reply(caller, uptime.isLive.weave({channel, hours, minutes}));
                    } else {
                        this.chat.reply(caller, uptime.notLive.weave({channel}));
                    }
                }
            },
            time: {
                args: [
                    { 
                        name: "chatter",
                        type: "string?"
                    }
                ],
                call: (caller: Chatter, requestedUser: string) => {
                    let chatter: Chatter;
                    if (requestedUser) {
                        chatter = this.chat.findChatter(requestedUser);
                        if (!chatter) return this.chat.reply(caller, "Are you sure '" + requestedUser + "' has been here before?");
                    } else chatter = caller;

                    this.chat.reply(caller, 
                        (requestedUser ? requestedUser + " has " : "You have ") + chatter.stat_time + " minutes logged."
                    );
                }
            }
        });

        // load all the plugins, add any commands the plugins provide to the command library
        this.plugins = new PluginManager("plugins", this.chat, this.commands, this.database, this.channel, this.options);
        this.plugins.forEach((plugin) => this.commands.add(plugin.commandLibrary));

        // on chat message, print the message, if it's a command, trigger the commands module
        this.chat.onChatMessage = (user: Chatter, message: string, isAction: boolean) => {
            let messages = output.messages;
            if (message[0] == "!") {
                this.logger.log(messages.commandCall.weave({user, message}));
                this.runCommand(user, message.slice(1));
                user.stat_commandsToDate++;
            } else {
                this.logger.log(messages.normal.weave({user, message, isAction}));
                user.stat_messagesToDate++;
            }
            user.save();
        };
        this.chat.onWhisper = (user: Chatter, message: string, isReceived: boolean) => {
            let whisper = output.messages.whisper;
            if (isReceived && message[0] == "!") {
                this.logger.log(whisper.commandCall.weave({user, message}));
                this.runCommand(user, message.slice(1));
                user.stat_commandsToDate++;
            } else {
                if (isReceived) {
                    this.logger.log(whisper.recieved.weave({user, message}));
                } else {
                    if (user.name == this.identity) {
                        this.logger.log(output.messages.console.response.weave({user, message}));
                    } else {
                        this.logger.log(whisper.sent.weave({user, message}));
                    }
                }
            }
        }

        let output = this.options.output;
        // if we've made it this far, we're ready to connect and start receiving!
        this.logger.log(output.bot.connecting.weave());
        this.chat.connect({
            channel: this.channel.name,
            identity: connectionOptions
        });
        this.logger.log(output.bot.connected.weave({channel: this.channel.name}));
        
        // enable input from the console now
        Console.input.enable();
        Console.onLine = (message: string) => {
            if (message[0] == "!") {
                this.logger.log(output.messages.console.commandCall.weave({message}));
                return this.runCommand(this.chat.getChatter(this.identity), message.slice(1));
            } else if (message[0] == "@") {
                let match = message.match(/^@([a-zA-Z0-9_]+)/);
                if (match) {
                    let user = match[1];
                    return this.whisper(user, message.slice(user.length + 1));
                }
            }
            this.say(message);
        }


        this._updateLoop = Timeline.repeat.forever(60, () => {
            this.channel.update();
            this.plugins.onUpdate();
        });
    }
}
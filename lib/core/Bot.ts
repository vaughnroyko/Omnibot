import weaving = require("weaving");
import { Console, Process } from "consolemate";
import { Database, Collection } from "typego";
var sync = require("synchronicity");

Console.init();
Console.input.advanced(true);
Console.clear();

console.log = Console.logLine;

import { Logger } from "./Logger";

import { Chat, Chatter, UserData, ChatHost } from "./Chat";
import { Commands } from "./Commands";

import { Plugins, InternalPlugin as Plugin } from "./Plugins";
import { PluginAPI } from "./PluginAPI";

import Ranks = require("./Ranks");

var databaseVersion = "1";

export class Bot implements ChatHost {
    public logger: Logger;
    public channel: string;
    public identity: string;
    public chat: Chat;
    public commands: Commands;
    public plugins: Plugin[];
    public database: Database;

    constructor (public options: any) {
        this.channel = options.twitch.channel;
        this.identity = options.twitch.identity;

        this.logger = new Logger("logs");

        this.logger.selected = "bot.log";
        this.logger.timestamp = true;
        this.logger.timestampFormat = this.options.output.timestamp;
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
        var result = this.commands.call(input, user);
        if (!result.success) {
            // TODO @stats -> command failure
            switch (this.options.output.commandFails) {
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
            this.database = new Database(this.options.mongo.path + "V" + databaseVersion + "#" + this.channel);
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
            //process.exit(1);
        }


        // connect to twitch 

        this.chat = new Chat(this);

        this.chat.onChatMessage = (user: Chatter, message: string, isAction: boolean) => {
            
            if (message[0] == "!") {
                this.logger.log(user.displayName + " " + message);
                
                this.runCommand(user, message.slice(1));
            } else {
                this.logger.log(user.displayName + (isAction ? " " : ": ") + message);
                // TODO @stats -> message
            }
        };

        var api = {
            say: this.say.bind(this),
            whisper: this.chat.whisper.bind(this.chat),
            chat: this.chat,
            database: this.database
        };

        this.commands = new Commands(api);
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
            }
        });

        this.plugins = Plugins.load("plugins", api);
        for (var plugin of this.plugins) {
            this.commands.add(plugin.commandLibrary);
        }
        this.commands.onUnknownCommand = (name: string) => {
            for (var plugin of this.plugins) {
                var command = plugin.onUnknownCommand(name);
                if (command) return command;
            }
        }

        this.logger.log("Connecting to twitch...");
        this.chat.connect({
            channel: this.channel,
            identity: connectionOptions
        });
        this.logger.log("Connected! Channel: #" + this.channel);
        
        Console.input.enable();
        Console.onLine = (line: string) => {
            if (line[0] == "!") {
                return this.runCommand(this.chat.getChatter(this.identity), line.slice(1));
            } else if (line[0] == "@") {
                var match = line.match(/^@([a-zA-Z0-9_]+)/);
                if (match) {
                    var user = match[1];
                    return this.whisper(user, line.slice(user.length + 1));
                }
            }
            this.say(line);
        }
    }
}
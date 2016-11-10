// load modules
import weaving = require("weaving");

import { Console, Process, Timeline } from "consolemate";
import { Database, Collection } from "typego";

import { request, requestSync, http } from "../util/requestSync";

// init modules
Console.init();
Console.input.advanced(true);
Console.clear();

console.log = Console.logLine;

// load modules from the bot
import { Logger } from "./Logger";

import { Chat, Chatter, UserData, ChatHost } from "./Chat";
import { Commands } from "./Commands";

import { Plugins, InternalPlugin as Plugin } from "./Plugins";
import { PluginAPI } from "./PluginAPI";

import Ranks = require("./Ranks");

// configuration
let databaseVersion = "1";
let gettingStreamData = {
    timeout: 60,
    logErrors: true
};
let whisperReplies = true;
let twitchApiStreamPath = "api.twitch.tv/kraken/streams/";

// the bot!
export class Bot implements ChatHost {
    private channel: string;
    private identity: string;

    public logger: Logger;
    public database: Database;

    private chat: Chat;
    private commands: Commands;
    private plugins: Plugin[];
    private api: PluginAPI;
    
    private _isLive: boolean;
    private _streamCreated: Date;
    private _updateLoop: Timeline.LoopHandle;

    get isLive () { return this._isLive; }
    // TODO experiment with catching when the connection goes down for a minute
    // a case where the stream is technically 'new' afterwards, but not intentionally
    get uptime () { return Date.now() - this._streamCreated.getTime(); }

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
        let result = this.commands.call(input, user);
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
            Timeline.after(5, () => {
                this.stop();
            });
            return;
        }


        // connect to twitch 
        this.chat = new Chat(this);

        // the api used by plugins
        this.api = {
            say: this.say.bind(this),
            whisper: this.chat.whisper.bind(this.chat),
            reply: whisperReplies ? this.chat.whisper.bind(this.chat) : (to: Chatter, ...what: string[]) => {
                this.say("@" + to.displayName, ...what);
            },
            chat: this.chat,
            database: this.database
        } as any;
        Object.defineProperty(this.api, "isLive", { get: () => this._isLive });

        // initiate the command library
        this.commands = new Commands(this.api);
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
            uptime: {
                call: (api: PluginAPI, caller: Chatter) => {
                    if (this._isLive) {
                        api.reply(caller, this.channel + " has been live for " + this.uptime);
                    } else {
                        api.reply(caller, this.channel + " is not live!");
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
                call: (api: PluginAPI, caller: Chatter, requestedUser: string) => {
                    let chatter: Chatter;
                    if (requestedUser) {
                        chatter = api.chat.findChatter(requestedUser);
                        if (!chatter) return api.reply(caller, "Are you sure '" + requestedUser + "' has been here before?");
                    } else chatter = caller;

                    api.reply(caller, 
                        (requestedUser ? requestedUser + " has " : "You have ") + chatter.stat_time + " minutes logged."
                    );
                }
            }
        });

        // load all the plugins, add any commands the plugins provide to the command library
        this.plugins = Plugins.load("plugins", this.api);
        for (let plugin of this.plugins) {
            this.commands.add(plugin.commandLibrary);
        }

        // send events to plugins
        this.commands.onUnknownCommand = (name: string) => {
            for (let plugin of this.plugins) {
                let command = plugin.onUnknownCommand(name);
                if (command) return command;
            }
        }
        this.chat.onUserJoin = (chatter: Chatter, isNew: boolean) => {
            for (let plugin of this.plugins) {
                plugin.onChatterJoin(chatter, isNew);
            }
        }

        // on chat message, print the message, if it's a command, trigger the commands module
        this.chat.onChatMessage = (user: Chatter, message: string, isAction: boolean) => {
            if (message[0] == "!") {
                this.logger.log(user.displayName + " " + message);
                this.runCommand(user, message.slice(1));
                user.stat_commandsToDate++;
            } else {
                this.logger.log(user.displayName + (isAction ? " " : ": ") + message);
                user.stat_messagesToDate++;
            }
            user.save();
        };
        this.chat.onWhisper = (user: Chatter, message: string, isReceived: boolean) => {
            if (isReceived && message[0] == "!") {
                this.logger.log(user.displayName + " " + message);
                this.runCommand(user, message.slice(1));
                user.stat_commandsToDate++;
            } else {
                this.logger.log((isReceived ? "<- " : "-> ") + user.displayName + ": " + message);
            }
        }

        // if we've made it this far, we're ready to connect and start receiving!
        this.logger.log("Connecting to twitch...");
        this.chat.connect({
            channel: this.channel,
            identity: connectionOptions
        });
        this.logger.log("Connected! Channel: #" + this.channel);
        
        // enable input from the console now
        Console.input.enable();
        Console.onLine = (line: string) => {
            if (line[0] == "!") {
                return this.runCommand(this.chat.getChatter(this.identity), line.slice(1));
            } else if (line[0] == "@") {
                let match = line.match(/^@([a-zA-Z0-9_]+)/);
                if (match) {
                    let user = match[1];
                    return this.whisper(user, line.slice(user.length + 1));
                }
            }
            this.say(line);
        }


        this._updateLoop = Timeline.repeat.forever(gettingStreamData.timeout, () => {
            let { response: { statusCode: code }, body: streamData } = 
                requestSync("https://" + twitchApiStreamPath + this.channel, { 
                    json: true,
                    headers: {
                        "Client-ID": "lwcc6qlehnacfjysb2jpkfl2to5pase"
                    }
                });

            if (code == 200) {
                if (streamData.stream) {
                    streamData = streamData.stream;
                    if (!this._isLive) {
                        this._isLive = true;
                        this._streamCreated = new Date(streamData.created_at);
                    }
                } else {
                    this._isLive = false;
                }
            } else {
                if (gettingStreamData.logErrors) console.log("Unable to load stream data.");
            }
        });
    }
}
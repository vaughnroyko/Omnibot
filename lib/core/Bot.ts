import { Console, Process } from "consolemate";

Console.connect();
Console.input.advanced(true);
Console.clear();

console.log = Console.logLine;

import { Logger } from "./Logger";
import { Database } from "../util/database";
Database.init();

import { Client, Options as ClientOptions } from "./Client";
import { weaving } from "weaving";

import { Chatters, Chatter } from "./Chatters";
import { Commands } from "./Commands";

export class Bot {
    public client: Client;
    public database: Database;
    public logger: Logger;
    public channel: string;
    public identity: string;
    public chatters: Chatters;
    public commands: Commands;

    constructor (public options: any) {
        this.channel = options.twitch.channel;
        this.identity = options.twitch.identity.username;
    }

    say (...what: any[]) {
        this.client.say(...what);
    }
    stop () {
        Process.exit();
    }
    restart () {
        Process.exit(4);
    }

    connect () {
        // load core library
        this.database = new Database("omnibot.v1#" + this.channel, this.options.mongo.path, this.options.mongo.connection);
        this.logger = new Logger("logs");

        this.logger.selected = "bot.log";
        this.logger.timestamp = true;
        this.logger.timestampFormat = this.options.output.timestamp;

        // if we can't connect to the database, there's no point in going any farther.
        try {
            this.database.connect();
        } catch (err) {
            this.logger.timestamp = false;
            this.logger.log(
                (err.name == "MongoError" && err.message.startsWith("connect ECONNREFUSED") ? (
                    "{#red:Couldn't connect to MongoDB.}"
                ):(
                    "{#red:{name}: {message}\n{1}}"
                )).weave(err, weaving.trimError(err.stack))
            );
            process.exit(1);
        }

        this.client = new Client({
            channel: this.options.twitch.channel,
            identity: this.options.twitch.identity
        });

        this.chatters = new Chatters(this.database);
        this.client.on("join", this.chatters.join.bind(this.chatters));
        this.client.on("part", this.chatters.part.bind(this.chatters));
        this.commands = new Commands({
            say: this.say.bind(this),
            stop: this.stop.bind(this),
            restart: this.restart.bind(this)
        });

        this.client.on("chat", (userData: any, message: string) => {
            var chatter = this.chatters.get(userData);
            this.logger.log(chatter.displayName + ": " + message);
            if (message[0] == "!") {
                // TODO @stats -> command
                var result = this.commands.call(message.slice(1), chatter);
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
            } else {
                // TODO @stats -> message
            }
        });
        this.client.on("action", (userData: any, message: string) => {
            this.logger.log(userData['display-name'] + " " + message);
        });

        this.logger.log("Connecting to twitch...");
        this.client.connectSync();
        this.logger.log("Connected! Channel: #" + this.channel);
        
        Console.input.enable();
        Console.onLine = function (line: string) 
        {
            Console.logLine("I just recieved '" + line + "' from the command line!");
        };
    }
}
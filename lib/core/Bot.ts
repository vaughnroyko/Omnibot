import { Console } from "consolemate";
Console.connect();
Console.input.advanced(true);
Console.clear();

import { Logger } from "./Logger";
import { Database } from "../util/database";

import { Client, Options as ClientOptions } from "./Client";
import { weaving } from "weaving";

export class Bot {
    public client: Client;
    public database: Database;
    public logger: Logger;
    public channel: string;
    public identity: string;
    public say: (...what: any[]) => void;

    constructor (public options: any) {
        this.channel = options.twitch.channel;
        this.identity = options.twitch.identity.username;
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
            identity: this.options.twitch.identity.username
        });

        this.client.connect(function () {
            Console.input.enable();
            Console.logLine("Hello! I'm Omnibot!");
            Console.onLine = function (line: string) {
                Console.logLine("I just recieved '" + line + "' from the command line!");
            };
        });

        this.say = this.client.say.bind(this.client);

        /*this.chatters = require("./core/chatters.js")(this);
        this.commands = require("./core/commands.js")(this);*/


        this.client.on("chat", (userData: any, message: string) => {
            //var chatter = chatters.get(userData);
            this.logger.log(userData['display-name'] + ": " + message);
            if (message[0] == "!") {
                // TODO @stats -> command
                //var result = commands.call(message.slice(1), chatter);
                /*if (!result.success) {
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
                }*/
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
    }
}
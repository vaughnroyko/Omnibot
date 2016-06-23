var _ = require("underscore-plus");

import { Chatter, Chatters } from "./Chatters";

module ArgumentMatcher {
    export function match (expected: { [key: string]: string }, given: { [key: string]: any }): { [key: string]: any } {
        return given;
    }
}

export interface RankMatcher {
    min?: number;
    max?: number;
}
export interface Command {
    rank?: string | number | RankMatcher;
    args?: { [key: string]: string };
    call(...args: any[]): void;
}
export interface Library {
    [key: string]: Command;
}

export interface CommandAPI {
    say(...what: any[]): void;
    stop(): void;
    restart(): void;
}

export class Commands {

    constructor (public api: CommandAPI) { }

    library: Library = {
        stop: {
            rank: "admin",
            call: function (bot: CommandAPI) {
                bot.say("Shutting down.. Bye guys... ;-;");
                bot.stop();
            }
        },
        restart: {
            rank: "admin",
            call: function (bot: CommandAPI) {
                bot.say("brbz");
                bot.restart();
            }
        },
        noah: {
            call: function (bot: CommandAPI) {
                bot.say("wow");
            }
        }
    };
    addLibrary (lib: Library) {
        _.extend(this.library, lib);
    }
    call (input: string, chatter: Chatter): { success: boolean, result?: any } {
        var splitCommand = input.split(/\s+/);
        var name = splitCommand[0];
        if (name in this.library) {
            var command = this.library[name];
            var args = "args" in command ? ArgumentMatcher.match(command.args, splitCommand.slice(1)) : undefined;
            if ("rank" in command) {
                var rank = command.rank;
                if (typeof rank == "object") {
                    var rankMatcher = rank as RankMatcher;
                    if (
                        ("min" in rankMatcher && chatter.rank < Chatters.getRank(rankMatcher.min)) ||
                        ("max" in rankMatcher && chatter.rank > Chatters.getRank(rankMatcher.max))
                    ) return { success: false };
                } else {
                    if (chatter.rank < Chatters.getRank(rank as string | number)) return { success: false };
                }
            }
            return { success: true, result: command.call(this.api, args) };
        }
        return { success: false };
    }
}
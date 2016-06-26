var _ = require("underscore-plus");

import Ranks = require("./Ranks");
import { Chatter, Chat } from "./Chat";
import { PluginAPI } from "./PluginAPI";

export class CommandFailure {
    constructor(public expected: Argument, public given?: string) {}
}

class ArgumentMatcher {
    constructor (private chat: Chat) {}

    match (expectedArguments: Argument[], givenArguments: string[]): any[] | CommandFailure {
        var result: any[] = [], consumeRemaining: Argument;
        for (var i = 0; i < expectedArguments.length || (consumeRemaining && i < givenArguments.length); i++) {

            var expected = consumeRemaining || expectedArguments[i], given = givenArguments[i];
            if (!given) return new CommandFailure(expected, given);

            var toPush: any;
            if (!consumeRemaining && expected.type.startsWith("...")) 
                expected = consumeRemaining = { name: expected.name, type: expected.type.slice(3) }, result.push([]);

            if (expected.type == "number") {
                toPush = parseFloat(given);
                if (isNaN(toPush)) return new CommandFailure(expected, given);
            } else if (expected.type == "user") {
                toPush = this.chat.getChatter(given);
                if (!toPush) return new CommandFailure(expected, given);
            } else if (expected.type == "string") toPush = given;
            if (consumeRemaining) result[result.length - 1].push(toPush); else result.push(toPush);

        }
        return result;
    }
}

export type Rank = string | number;
export interface RankMatcher {
    min?: Rank;
    max?: Rank;
}
export interface Argument {
    name: string;
    type?: string;
};
export interface Command {
    rank?: Rank | RankMatcher;
    args?: Argument[];
    call(api: PluginAPI, ...args: any[]): void;
}
export interface Library {
    [key: string]: Command | Library;
}

export module Library {
    export function merge (lib: Library, ...toAdd: Library[]) {
        _.extend(lib, ...toAdd);
    }
    export function remove (lib: Library, ...toRemove: Library[]) {
        for (var libToRemoveWith of toRemove) {
            for (var commandName in libToRemoveWith) {
                if (commandName in lib) delete lib[commandName];
            }
        }
    }
}
export class Commands {

    private argumentMatcher: ArgumentMatcher;

    constructor (public api: PluginAPI) {
        this.argumentMatcher = new ArgumentMatcher(api.chat);
    }

    library: Library = {};
    add (...lib: Library[]) {
        Library.merge(this.library, ...lib);
    }
    call (input: string, chatter: Chatter): { success: boolean, result?: any } {
        var result: { success: boolean, result?: any } = { success: false };
        var splitCommand = input.split(/\s+/);
        var lib = this.library, name: string;
        do {
            name = splitCommand.shift();
            if (!(name && name in lib)) {
                if (!name || lib != this.library) return result;

                // command doesn't exist, call api to see if any plugins can handle it
                lib[name] = this.onUnknownCommand(name);
                if (!lib[name]) return result;
            }
            if ("call" in lib[name]) break;
            else lib = lib[name] as Library;
        } while (true);
        var command = lib[name] as Command;
        var args: any[] = [];
        if ("args" in command) {
            args = this.argumentMatcher.match(command.args, splitCommand) as any[];
            if (args instanceof CommandFailure) {
                // TODO emit command failure event here
                return result;
            }
        }
        if ("rank" in command) {
            var rank = command.rank;
            if (typeof rank == "object") {
                var rankMatcher = rank as RankMatcher;
                if (
                    ("min" in rankMatcher && chatter.rank < Ranks.get(rankMatcher.min)) ||
                    ("max" in rankMatcher && chatter.rank > Ranks.get(rankMatcher.max))
                ) return result;
            } else {
                if (chatter.rank < Ranks.get(rank as any)) return result;
            }
        }
        return { success: true, result: command.call(this.api, chatter, ...args) };
    }

    onUnknownCommand (name: string): Command | Library { return; }
}
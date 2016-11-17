let _ = require("underscore-plus");

import Ranks = require("./support/Ranks");
import { Chatter, Chat } from "./Chat";
import { PluginAPI } from "./support/PluginAPI";

import weaving = require("weaving");

export class ArgumentsProvidedError extends weaving.Error {
    weavingMessage = "Expected type of argument '{0}' to be '{1}'{2?, but was given '{2}'}";
}
export class ArgumentMatchingError extends weaving.Error {
    weavingMessage = "{0}";
}

export type Rank = string | number;
export interface RankMatcher {
    min?: Rank;
    max?: Rank;
}
export interface Argument {
    name: string;
    type?: string;
}
export interface Command {
    rank?: Rank | RankMatcher;
    args?: Argument[];
    call(...args: any[]): void;
}
export interface Library {
    [key: string]: Command | Library;
}

export module Library {
    export function merge (lib: Library, ...toAdd: Library[]) {
        _.extend(lib, ...toAdd);
    }
    export function remove (lib: Library, ...toRemove: Library[]) {
        for (let libToRemoveWith of toRemove) {
            for (let commandName in libToRemoveWith) {
                if (commandName in lib) delete lib[commandName];
            }
        }
    }
}
export class Commands {

    constructor (private chat: Chat) {}

    private match (expectedArguments: Argument[], givenArguments: string[]): any[] | ArgumentsProvidedError {
        let result: any[] = [], consumeRemaining: Argument, optionalRemaining = false;
        for (let i = 0; i < expectedArguments.length || (consumeRemaining && i < givenArguments.length); i++) {

            let expected = consumeRemaining || expectedArguments[i], given = givenArguments[i];
            if (expected.type.endsWith("?")) 
                optionalRemaining = true, expected = { name: expected.name, type: expected.type.slice(0, -1) };
            else if (optionalRemaining) 
                return new ArgumentMatchingError("All requested arguments following an optional argument must also be optional.");

            if (!given && !optionalRemaining) return new ArgumentsProvidedError(expected.name || i, given);

            let toPush: any;
            if (!consumeRemaining && expected.type.startsWith("...")) 
                expected = consumeRemaining = { name: expected.name, type: expected.type.slice(3) }, result.push([]);

            if (expected.type == "number" || expected.type == "integer") {
                toPush = expected.type == "number" ? parseFloat(given) : parseInt(given);
                if (isNaN(toPush)) return new ArgumentsProvidedError(expected, given);
            } else if (expected.type == "user") {
                toPush = this.chat.getChatter(given);
                if (!toPush) return new ArgumentsProvidedError(expected, given);
            } else if (expected.type == "string") toPush = given;
            if (consumeRemaining) result[result.length - 1].push(toPush); else result.push(toPush);

        }
        return result;
    }

    library: Library = {};
    add (...lib: Library[]) {
        Library.merge(this.library, ...lib);
    }
    call (input: string, chatter: Chatter): { success: boolean, result?: any } {
        let result: { success: boolean, result?: any } = { success: false };
        let splitCommand = input.split(/\s+/);
        let lib = this.library, name: string;
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
        let command = lib[name] as Command;
        let args: any[] = [];
        if ("args" in command) {
            args = this.match(command.args, splitCommand) as any[];
            if (args instanceof ArgumentsProvidedError) {
                // TODO emit command failure event here
                return result;
            }
        }
        if ("rank" in command) {
            let rank = command.rank;
            if (typeof rank == "object") {
                let rankMatcher = rank as RankMatcher;
                if (
                    ("min" in rankMatcher && chatter.rank < Ranks.get(rankMatcher.min)) ||
                    ("max" in rankMatcher && chatter.rank > Ranks.get(rankMatcher.max))
                ) return result;
            } else {
                if (chatter.rank < Ranks.get(rank as any)) return result;
            }
        }
        return { success: true, result: command.call(chatter, ...args) };
    }

    onUnknownCommand (name: string): Command | Library { return; }
}
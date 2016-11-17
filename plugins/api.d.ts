import * as typego from "typego";

declare module api {
    // database stuff (re-exporting from typego)
    export class Database extends typego.Database {}
    export class Document extends typego.Document {}
    export class Collection<T extends Document> extends typego.Collection<T> {}
    export class Query<T extends Document> extends typego.Query<T> {}
    export interface Schema extends typego.Schema {}

    // chatters
    export interface Chat {
        /**
         * Find a chatter.
         */
        findChatter(username: string): Chatter;
        /**
         * Get a list of all chatters currently watching.
         */
        listChatters(): Chatter[];
        /**
         * Send a message to the chat.
         */
        say(...what: any[]): void;
        /**
         * Whisper a message to a single user.
         */
        whisper(to: Chatter | string, ...what: any[]): void;
    }
    export interface Chatter {
        name: string;
        rank: number;
        displayName: string;
        chatting: boolean;
        stored: Document;
        time: Date;
    }

    // api
    export enum Ranks {
        new = 0,
        regular = 1,
        user = 1,
        viewer = 1,
        mod = 2,
        moderator = 2,
        admin = 3,
        administrator = 3,
        channel = 4,
        broadcaster = 4,
        bot = 5,
        omnibot = 5
    }
    export module Ranks {
        export function get (which: string | number): Ranks;
    }

    
    export interface Channel {
        name: string;
        live: boolean;
        status: string;
        language: string;
        stream: Stream;
    }
    export interface Stream {
        start: Date;
        viewers: string;
        game: string;
    }
    export interface OfflineChannel extends Channel {
        live: false;
        stream: undefined;
    }
    export interface LiveChannel extends Channel {
        live: true;
        stream: Stream;
    }

    export interface Options {
        core: {},
        mongo: {
            path: string;
        },
        output: {
            timestamp: string;
            commands: {
                failure: "whisper" | "global";
            },
            bot: {
                twitchApiFailure: string;
            },
            channel: {
                wentLive: string;
                isLive: string;
                notLive: string;
            }
        },
        plugins: {},
        keywords: {},
        twitch: {
            channel: string,
            identity: string
        }
    }

    export interface API {
        say (...what: any[]): void;
        whisper (to: string, ...what: any[]): void;
        reply (...what: any[]): void;
        chat: Chat;
        database: Database;
        channel: Channel,
        options: Options;
    }
    
    // commands
    export interface RankMatcher {
        min?: Ranks;
        max?: Ranks;
    }
    export interface Argument {
        name: string;
        type?: ArgumentType;
    }
    export type ArgumentType = "string" | "number" | "integer" | "boolean" | "string?" | "number?" | "integer?" | "boolean?";
    export interface Command {
        rank?: Ranks | RankMatcher;
        args?: Argument[];
        call(...args: any[]): void;
    }
    export interface CommandLibrary {
        [key: string]: Command | CommandLibrary;
    }

    // plugins
    export abstract class Plugin {
        name: string;
        commands: CommandLibrary;
        protected api: API;
        constructor(name: string, api: API);

        //// TODO more api support
        onInit (): void;
        //onClosing (): void {}
        onUnknownCommand (commandName: string): Command | CommandLibrary;
        onChatterJoin (chatter: Chatter, isNew: boolean): void;
        onChatterPart (chatter: Chatter, isNew: boolean): void;
        onUpdate (): void;
        //onCommandFailed (): void {}
        //onChat (user: Chatter, message: string, whisper = false): void {}

        [key: string]: any;
    }
}
export = api;
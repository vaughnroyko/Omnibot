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

    export interface API {
        reply (to: Chatter, ...what: any[]): void;
        chat: Chat;
        database: Database;
        isLive: boolean;
    }
    
    // commands
    export interface RankMatcher {
        min?: Ranks;
        max?: Ranks;
    }
    export interface Argument {
        name: string;
        type?: string;
    }
    export interface Command {
        rank?: Ranks | RankMatcher;
        args?: Argument[];
        call(api: API, ...args: any[]): void;
    }
    export interface CommandLibrary {
        [key: string]: Command | CommandLibrary;
    }

    // plugins
    export abstract class Plugin {
        name: string;
        commands: CommandLibrary;
        constructor(name: string);

        onInit (api: API): void;
        //onClosing (): void;
        onUnknownCommand (api: API, commandName: string): Command | CommandLibrary;
        onNewChatter (api: API, chatter: Chatter): void;
        //onCommandFailed (): void;
        //onChat (user: Chatter, message: string, whisper?: boolean): void;

        [key: string]: any;
    }
}
export = api;
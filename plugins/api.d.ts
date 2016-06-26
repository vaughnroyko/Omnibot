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
        getChatter(data: string): Chatter;
        listChatters(): Chatter[];
        say(...what: any[]): void;
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
        user = 0,
        regular = 1,
        viewer = 1,
        mod = 2,
        moderator = 2,
        admin = 3,
        administrator = 3,
        channel = 4,
        broadcaster = 4,
        bot = 5
    }
    export interface API {
        say(...what: any[]): void;
        chat: Chat;
        database: Database;
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
    export class Plugin {
        name: string;
        commands: CommandLibrary;
        constructor(name: string);

        onInit (api: API): void;
        //onClosing (): void;
        onUnknownCommand (api: API, commandName: string): Command | CommandLibrary;
        //onCommandFailed (): void;
        //onChat (user: Chatter, message: string, whisper?: boolean): void;

        [key: string]: any;
    }
}
export = api;
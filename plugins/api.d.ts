import * as typego from "typego";

declare module api {
    // re-export all of the typego stuff
    export class Database extends typego.Database {}
    export class Document extends typego.Document {}
    export class Collection<T extends Document> extends typego.Collection<T> {}
    export class Query<T extends Document> extends typego.Query<T> {}
    export interface Schema extends typego.Schema {}

    export interface Chatters {
        new(name: string, rank: string | number): Chatter;
        get(data: Chatter | string | any): Chatter;
        join(chatter: Chatter | string | any): void;
        part(chatter: Chatter | string | any): void;
        list(): Chatter[];
    }
    export interface Chatter {
        name: string;
        rank: number;
        displayName: string;
        chatting: boolean;
        stored: Document;
        time: Date;
    }

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
        call(...args: any[]): void;
    }
    export interface CommandLibrary {
        [key: string]: Command | CommandLibrary;
    }
    export interface CommandAPI {
        say(...what: any[]): void;
        stop(): void;
        restart(): void;
        chatters: Chatters;
        database: Database;
    }
    export class Plugin {
        name: string;
        commands: CommandLibrary;
        constructor(name: string);

        onInit (): void;
        //onClosing (): void;
        //onCommandCalled (commandName: string): Command | CommandLibrary;
        //onCommandFailed (): void;
        //onChat (user: Chatter, message: string, whisper?: boolean): void;
    }
}
export = api;
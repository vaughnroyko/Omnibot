declare interface Chatters {
    new(name: string, rank: string | number): Chatter;
    get(data: Chatter | string | any): Chatter;
    join(chatter: Chatter | string | any): void;
    part(chatter: Chatter | string | any): void;
    list(): Chatter[];
}
declare module Chatters {
    function getRank(rank: string | number): number;
}
declare interface Chatter {
    name: string;
    rank: number;
    displayName: string;
    chatting: boolean;
    stored: Document;
    time: Date;
}

declare type Rank = string | number;
declare interface RankMatcher {
    min?: Rank;
    max?: Rank;
}
declare interface Argument {
    name: string;
    type?: string;
}
declare interface Command {
    rank?: Rank | RankMatcher;
    args?: Argument[];
    call(...args: any[]): void;
}
declare interface CommandLibrary {
    [key: string]: Command | CommandLibrary;
}
declare interface CommandAPI {
    say(...what: any[]): void;
    stop(): void;
    restart(): void;
}
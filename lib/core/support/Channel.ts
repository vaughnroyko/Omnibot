
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
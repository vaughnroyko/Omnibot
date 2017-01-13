export interface IChannel {
    name: string;
    live: boolean;
    status: string;
    language: string;
    stream: IStream;
    created: Date;
    game: string;
    mature: boolean;
    views: number;
    followers: number;
}
export interface IStream {
    start: Date;
    uptime: number;
    viewers: string;
    game: string;
}
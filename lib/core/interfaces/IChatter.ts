export interface IChatter {
    name: string;
    rank: number;
    displayName: string;
    chatting: boolean;
    joined: Date;
    stat_time: number;
    stat_messagesToDate: number;
    stat_streamsAttended: number;
    stat_commandsToDate: number;
}
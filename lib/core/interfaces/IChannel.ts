export interface IStreamData {
	start: Date;
	uptime: number;
	viewers: number;
	game: string;
}
export interface IChannelData {
	name: string;
	live: boolean;
	status: string;
	language: string;
	stream: IStreamData;
	created: Date;
	game: string;
	mature: boolean;
	views: number;
	followers: number;
}
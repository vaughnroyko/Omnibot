export interface IChannel {
	mature: boolean;
	status: string;
	broadcaster_language: string;
	display_name: string;
	game: string;
	language: string;
	_id: number;
	name: string;
	created_at: string;
	updated_at: string;
	partner: boolean;
	logo: string;
	video_banner: string;
	profile_banner: string;
	profile_banner_background_color: string | null;
	url: string;
	views: number;
	followers: number;
	_links: {
		self: string;
		follows: string;
		commercial: string;
		stream_key: string;
		chat: string;
		features: string;
		subscriptions: string;
		editors: string;
		teams: string;
		videos: string;
	};
	delay: number | null;
	banner: null;
	background: null;
}

export interface IStream {
	stream: null | {
		_id: number;
		game: string;
		viewers: number;
		video_height: number;
		average_fps: number;
		delay: number;
		created_at: string;
		is_playlist: boolean;
		stream_type: string;
		preview: {
			small: string;
			medium: string;
			large: string;
			template: string;
		};
		channel: IChannel;
		_links: {
			self: string;
		};
	};
	_links: {
		self: string;
		channel: string;
	};
}
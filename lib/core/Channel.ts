
import { request, requestSync, http } from "../util/requestSync";

import { Logger } from "./Logger";
import { Options } from "./interfaces/Options";
import { IChannelData, IStreamData } from "./interfaces/IChannel";
import * as TwitchApi from "./interfaces/TwitchApi";

const twitchApiPath = "api.twitch.tv/kraken/";
const requestOptions = {
	json: true,
	headers: {
		"Client-ID": "lwcc6qlehnacfjysb2jpkfl2to5pase",
	},
};

export class Channel {
	private _data: IChannelData = {
		name: undefined as string,
		live: undefined as boolean,
		status: undefined as string,
		language: undefined as string,
		stream: undefined as IStreamData,
		created: undefined as Date,
		game: undefined as string,
		mature: undefined as boolean,
		views: undefined as number,
		followers: undefined as number,
	};
	readonly data: IChannelData;

	constructor(name: string, private logger: Logger, private options: Options) {
		this._data.name = name;

		const channelData = this._data;
		this.data = {
			get name () { return channelData.name; },
			get live () { return channelData.live; },
			get status () { return channelData.status; },
			get language () { return channelData.language; },
			get stream () { return channelData.stream; },
			get created () { return channelData.created; },
			get game () { return channelData.game; },
			get mature () { return channelData.mature; },
			get views () { return channelData.views; },
			get followers () { return channelData.followers; },
		};
	}

	/** Update the state of the channel using the twitch api */
	async update () {
		const output = this.options.output;

		const streamData = await this.requestStreamData();

		if (streamData) {
			// the stream is live
			this._data.status = streamData.channel.status;
			if (this.data.status === undefined) {
				this.updateChannel(streamData.channel);
			}
			if (!this.data.live) {
				if (this.data.live === undefined)
					this.logger.log(output.channel.isLive.weave({ channel: this._data }));
				else
					this.logger.log(output.channel.wentLive.weave({ channel: this._data }));
				this._data.stream = {
					start: new Date(streamData.created_at),
					viewers: streamData.viewers,
					game: streamData.game,
					uptime: undefined,
				};
				Object.defineProperty(this._data.stream, "uptime", {
					get: () => Date.now() - this._data.stream.start.getTime(),
				});
				this._data.live = true;
			}
		} else {
			// the stream is offline
			if (this.data.status === undefined) {
				// the channel data hasn't been set yet
				this.updateChannel();
			}
			if (this.data.live === undefined)
				this.logger.log(output.channel.notLive.weave({ channel: this._data }));
			else if (this.data.live)
				this.logger.log(output.channel.wentOffline.weave({ channel: this._data }));
			this._data.live = false;
		}
	}

	private async requestTwitchApi (url: string) {
		const output = this.options.output;

		const response = await request(
			"https://" + twitchApiPath + url,
			requestOptions,
		);

		if (!response || response.code !== 200) {
			this.logger.logTo("err", output.bot.twitchApiFailure.weave());
			return;
		}

		return response.body;
	}

	private async requestStreamData () {
		return (await this.requestTwitchApi("streams/" + this.data.name) as TwitchApi.IStream).stream;
	}

	private async requestChannelData () {
		return this.requestTwitchApi("channels/" + this.data.name) as Promise<TwitchApi.IChannel>;
	}

	private async updateChannel (channelData?: TwitchApi.IChannel) {
		if (!channelData) channelData = await this.requestChannelData();
		if (channelData) {
			this._data.status = channelData.status;
			this._data.language = channelData.language;
			this._data.created = new Date(channelData.created_at);
			this._data.game = channelData.game;
			this._data.mature = channelData.mature;
		}
	}
}
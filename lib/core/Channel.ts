
import { request, requestSync, http } from "../util/requestSync";

import { Logger } from "./Logger";
import { Options } from "./interfaces/Options";
import { IChannel, IStream } from "./interfaces/IChannel";

let twitchApiPath = "api.twitch.tv/kraken/";

export class Channel implements IChannel {
    private properties = {
        name: undefined as string,
        live: undefined as boolean,
        status: undefined as string,
        language: undefined as string,
        stream: undefined as IStream,
        created: undefined as Date,
        game: undefined as string,
        mature: undefined as boolean,
        views: undefined as number,
        followers: undefined as number
    };
    get name () { return this.properties.name; }
    get live () { return this.properties.live; }
    get status () { return this.properties.status; }
    get language () { return this.properties.language; }
    get stream () { return this.properties.stream; }
    get created () { return this.properties.created; }
    get game () { return this.properties.game; }
    get mature () { return this.properties.mature; }
    get views () { return this.properties.views; }
    get followers () { return this.properties.followers; }

    constructor (name: string, private logger: Logger, private options: Options) {
        this.properties.name = name;
    }

    update () {
        let requestOptions = { 
            json: true,
            headers: {
                "Client-ID": "lwcc6qlehnacfjysb2jpkfl2to5pase"
            }
        };
        let { response: { statusCode: code }, body: streamData } = requestSync(
            "https://" + twitchApiPath + "streams/" + this.name, 
            requestOptions
        );

        let output = this.options.output;
        if (code == 200) {
            if (streamData.stream) {
                streamData = streamData.stream;
                this.properties.status = streamData.channel.status;
                if (!this.live) {
                    if (this.live === undefined)
                        this.logger.log(output.channel.isLive.weave({channel: this.properties}));
                    else
                        this.logger.log(output.channel.wentLive.weave({channel: this.properties}));
                    this.properties.stream = {
                        start: new Date(streamData.created_at),
                        viewers: streamData.viewers,
                        game: streamData.game,
                        uptime: undefined
                    };
                    Object.defineProperty(this.properties.stream, "uptime", {
                        get: () => Date.now() - this.properties.stream.start.getTime()
                    });
                    this.properties.live = true;
                }
            } else {
                if (this.status === undefined) {
                    let { response: { statusCode: code }, body: channelData } = requestSync(
                        "https://" + twitchApiPath + "channels/" + this.name, 
                        requestOptions
                    );
                    this.properties.status = channelData.status;
                    this.properties.language = channelData.language;
                    this.properties.created = new Date(channelData.created_at);
                    this.properties.game = channelData.game;
                    this.properties.mature = channelData.mature;
                }
                if (this.live === undefined) 
                    this.logger.log(output.channel.notLive.weave({channel: this.properties}));
                else if (this.live)
                    this.logger.log(output.channel.wentOffline.weave({channel: this.properties}));
                this.properties.live = false;
            }
        } else {
            this.logger.logTo("err", output.bot.twitchApiFailure.weave());
        }

    }
}
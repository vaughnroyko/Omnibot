
import { request, requestSync, http } from "../../util/requestSync";

import { Logger } from "../Logger";
import Options = require("./Options");

let twitchApiPath = "api.twitch.tv/kraken/";

export class Channel {
    name: string;
    live: boolean;
    status: string;
    language: string;
    stream: Stream;
    created: Date;
    game: string;
    mature: boolean;
    views: number;
    followers: number;

    constructor (name: string, private logger: Logger, private options: Options) {
        this.name = name;
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
                this.status = streamData.channel.status;
                if (!this.live) {
                    if (this.live === undefined)
                        this.logger.log(output.channel.isLive.weave(this.name, this.status));
                    else
                        this.logger.log(output.channel.wentLive.weave(this.name, this.status));
                    this.stream = {
                        start: new Date(streamData.created_at),
                        viewers: streamData.viewers,
                        game: streamData.game
                    };
                    this.live = true;
                }
            } else {
                if (this.status === undefined) {
                    let { response: { statusCode: code }, body: channelData } = requestSync(
                        "https://" + twitchApiPath + "channels/" + this.name, 
                        requestOptions
                    );
                    this.status = channelData.status;
                    this.language = channelData.language;
                    this.created = new Date(channelData.created_at);
                    this.game = channelData.game;
                    this.mature = channelData.mature;
                }
                if (this.live === undefined) 
                    this.logger.log(output.channel.notLive.weave(this.name, this.status));
                else if (this.live)
                    this.logger.log(output.channel.wentOffline.weave(this.name, this.status));
                this.live = false;
            }
        } else {
            this.logger.logTo("err", output.bot.twitchApiFailure.weave());
        }

    }
}
export interface Stream {
    start: Date;
    viewers: string;
    game: string;
}
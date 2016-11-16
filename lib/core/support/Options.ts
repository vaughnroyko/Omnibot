/**
 * This document contains every option the bot takes
 */
interface Options {
    core: {},
    mongo: {
        path: string;
    },
    output: {
        timestamp: string;
        commands: {
            failure: "whisper" | "global";
        },
        bot: {
            twitchApiFailure: string;
        },
        channel: {
            wentLive: string;
            isLive: string;
            notLive: string;
        }
    },
    plugins: {},
    keywords: {},
    twitch: {
        channel: string,
        identity: string
    }
}
export = Options;
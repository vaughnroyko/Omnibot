/**
 * This document contains every option the bot takes
 */
interface Options {
    core: {}
    mongo: {
        path: string;
    }
    output: {
        timestamp: string;
        commands: {
            failure: "whisper" | "global";
            uptime: {
                isLive: string;
                notLive: string;
            }
        }
        bot: {
            connecting: string;
            connected: string;
            twitchApiFailure: string;
        }
        channel: {
            wentLive: string;
            wentOffline: string;
            isLive: string;
            notLive: string;
        }
        messages: {
            normal: string;
            commandCall: string;
            whisper: {
                sent: string;
                recieved: string;
                commandCall: string;
            }
            console: {
                commandCall: string;
                response: string;
            }
        }
    }
    plugins: {}
    keywords: {
        greetings: string[];
        farewells: string[];
    }
    twitch: {
        channel: string;
        /*
         * In the twitch.cson file, provide identity as an object containing
         * the username and password of your bot account.
         * identity: {
         *     username: string;
         *     password: string;
         * }
         */
        identity: string;
    }
}
export = Options;
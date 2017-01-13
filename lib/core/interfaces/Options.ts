import { IChannel } from "./IChannel";
import { IChatter } from "./IChatter";

export interface FancyWeavingString<T> extends String {
    weave (fancy: T): string;
}
export interface ChannelWeavingString extends FancyWeavingString<{channel: IChannel}> {}
export interface BotWeavingString extends FancyWeavingString<{botName: string}> {}
export interface ChatterWeavingString extends FancyWeavingString<{chatter: IChatter}> {}
export interface ChatterCommandWeavingString extends FancyWeavingString<{caller: IChatter, chatter?: IChatter}> {}

/**
 * This document contains every option the bot takes
 */
export interface Options {
    core: {}
    mongo: {
        path: string;
    }
    output: OutputOptions;
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

export interface OutputOptions {
    timestamp: FancyWeavingString<{year: number, month: string, monthName: string, date: string, hour: string, minute: string, second: string, anteMeridiem: boolean, postMeridiem: boolean}>;
    commands: {
        failure: "whisper" | "global";
        uptime: {
            isLive: FancyWeavingString<{channel: IChannel, seconds: number, minutes: number, hours: number, days: number, years: number}>;
            notLive: ChannelWeavingString;
        }
        time: {
            normal: ChatterCommandWeavingString;
            blacklisted: ChatterCommandWeavingString;
            unknown: ChatterCommandWeavingString;
        }
        status: ChannelWeavingString;
    }
    bot: {
        connecting: ChannelWeavingString;
        connected: ChannelWeavingString;
        twitchApiFailure: string;

        stop: BotWeavingString;
        restart: BotWeavingString;
        back: BotWeavingString;
    }
    chatters: {
        rankUp: ChatterWeavingString;
        list: FancyWeavingString<{chatters: IChatter[]}>;
        join: ChatterWeavingString;
        part: ChatterWeavingString;
    }
    channel: {
        wentLive: ChannelWeavingString;
        wentOffline: ChannelWeavingString;
        isLive: ChannelWeavingString;
        notLive: ChannelWeavingString;
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
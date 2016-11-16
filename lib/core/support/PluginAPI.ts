import { Chat } from "../Chat";
import { Channel } from "./Channel";
import Options = require("./Options");

import { Database } from "typego";

export interface PluginAPI {
    say (...what: any[]): void;
    whisper (to: string, ...what: any[]): void;
    reply (...what: any[]): void;
    chat: Chat;
    database: Database;
    channel: Channel,
    options: Options;
}
export interface CallbackHost {
    cancel (): void;
    cancelled: boolean;
    paused: boolean;
}
import { Chat } from "./Chat";
import { Database } from "typego";
export interface PluginAPI {
    say(...what: any[]): void;
    whisper(to: string, ...what: any[]): void;
    reply(...what: any[]): void;
    chat: Chat;
    database: Database;
}
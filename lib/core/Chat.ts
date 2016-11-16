//// TODO
let whisperReplies = true;

import { Database, Collection, Schema, Document } from "typego";
import { Timeline } from "consolemate";

import Ranks = require("./support/Ranks");

import { Client, ClientOptions } from "./Client";
export { ClientOptions };

export interface UserData {
    name: string;
    "display-name"?: string;
    mod?: boolean;
}

export class Chat {
    private client: Client;
    private chatters: Collection<Chatter>;
    private username: string;
    private channel: string;

    constructor(database: Database, isLive: () => boolean) {
        this.chatters = database.collection<Chatter>("chatters", {
            name: { type: String, unique: true },
            displayName: { type: String, fillWith: "name" },
            rank: { type: Number, default: Ranks["new"] },
            chatting: { type: Boolean, default: false },
            joined: { type: Date, generator: () => new Date() },
            stat_time: { type: Number, default: 0 },
            stat_messagesToDate: { type: Number, default: 0 },
            stat_streamsAttended: { type: Number, default: 0 },
            stat_commandsToDate: { type: Number, default: 0 }
        });

        this.client = new Client();
        this.client.on("join", this.join.bind(this));
        this.client.on("part", this.part.bind(this));
        this.client.on("whisper", (userData: UserData, message: string, self: boolean) => {
            if (!self) {
                let chatter = this.getChatter(userData);
                if (this.onWhisper) this.onWhisper(chatter, message.trim(), true);
            }
        });
        
        this.client.on("chat", (userData: UserData, message: string) => {
            let chatter = this.getChatter(userData);
            if (this.onChatMessage) this.onChatMessage(chatter, message, false);
        });
        this.client.on("action", (userData: UserData, message: string) => {
            let chatter = this.getChatter(userData);
            if (this.onChatMessage) this.onChatMessage(chatter, message, true);
        });

        Timeline.repeat.forever(60, () => {
            if (isLive()) {
                this.chatters.where({ chatting: true }).update({ $inc: { stat_time: 1 } });
            }
        });
    }

    /**
     * Connect to the twitch chat.
     */
    connect (options: ClientOptions) {
        this.username = options.identity.username;
        this.channel = options.channel;
        this.client.connectSync(options);
    }

    /**
     * Retrieve a chatter from the database. If the chatter doesn't exist yet, add them to the database.
     */
    getChatter (data: string | UserData): Chatter {
        let name: string, rank = Ranks["new"];
        
        if (typeof data == "object") {
            let userData = data as UserData;
            name = userData.name || userData["display-name"];
            if ("mod" in userData) rank = userData.mod ? Ranks.mod : Ranks["new"];
        } else if (typeof data == "string") name = data as string;
        name = name.toLowerCase();

        let result = this.chatters.where({ name: name }).findOne();

        if (name == this.username.toLowerCase()) rank = Ranks.bot;
        else if (name == this.channel.toLowerCase()) rank = Ranks.channel;

        if (result && (result.verify() || result.repair())) {
            if (rank != result.rank) result.rank = rank;
            result.save();
        } else if (!result) {
            result = this.chatters.insert({
                name: name,
                rank: rank
            });
            result["isNew"] = true;
        }

        return result;
    }

    /**
     * Find a chatter.
     */
    findChatter (username: string) {
        return this.chatters.where({ name: username }).findOne();
    }

    /**
     * When a user joins the chat.
     */
    private join (chatter: string | UserData) {
        let ch = this.getChatter(chatter);
        ch.chatting = true;
        ch.save();
        if (this.onChatterJoin) this.onChatterJoin(ch, ch["isNew"]);
    }
    /**
     * When a user leaves the chat.
     */
    private part (chatter: string | UserData) {
        let ch = this.getChatter(chatter);
        ch.chatting = false;
        ch.save();
        if (this.onChatterPart) this.onChatterPart(ch);
    }

    /**
     * List all of the users currently in the chat.
     */
    listChatters () {
        return this.chatters.where({chatting: true}).find();
    }
    
    /**
     * Send a chat message.
     */
    say (...what: any[]) {
        this.client.say(...what);
    }

    /**
     * Whisper to a user.
     */
    whisper (to: Chatter | string, ...what: any[]) {
        let user: string = typeof to == "string" ? to as string : (to as Chatter).name;
        this.client.whisper(user, ...what);
        if (this.onWhisper)
            this.onWhisper(typeof to == "string" ? this.getChatter(to) : to as Chatter, what.join(" ").trim(), false);
    }

    reply (to: Chatter, ...what: string[]) {
        if (whisperReplies) this.whisper(to, ...what);
        else this.say("@" + to.displayName, ...what);
    }


    // events

    /**
     * Called when a user joins the chat.
     */
    onChatterJoin: (user: Chatter, isNew: boolean) => void;
    /**
     * Called when a user leaves the chat.
     */
    onChatterPart: (user: Chatter) => void;
    /**
     * Called when a chat message is recieved.
     */
    onChatMessage: (user: Chatter, message: string, isAction: boolean) => void;
    /**
     * Called when a whisper is sent or recieved.
     */
    onWhisper: (user: Chatter, message: string, isReceived: boolean) => void;
}

export class Chatter extends Document {
    public name: string;
    public rank: number;
    public displayName: string;
    public chatting: boolean;
    public joined: Date;
    public stat_time: number;
    public stat_messagesToDate: number;
    public stat_streamsAttended: number;
    public stat_commandsToDate: number;
}
import { Database, Collection, Schema, Document } from "typego";

import Ranks = require("./Ranks");

import { Logger } from "./Logger";

import { Client, ClientOptions } from "./Client";
export { ClientOptions };

export interface UserData {
    name: string;
    "display-name"?: string;
    mod?: boolean;
}

export interface ChatHost {
    database: Database;
    logger: Logger;
}

export class Chat {
    private client: Client;
    private chatters: Collection<Chatter>;
    private username: string;
    private channel: string;

    constructor(private host: ChatHost) {
        this.chatters = this.host.database.collection<Chatter>("chatters", {
            name: { type: String, unique: true },
            displayName: { type: String, fillWith: "name" },
            rank: { type: Number, default: Ranks["new"] },
            chatting: { type: Boolean, default: false },
            firstJoin: { type: Date, generator: () => Date.now() },
            time: { type: Number, default: 0 }
        });

        this.client = new Client();
        this.client.on("join", this.join.bind(this));
        this.client.on("part", this.part.bind(this));
        
        this.client.on("chat", (userData: UserData, message: string) => {
            var chatter = this.getChatter(userData);
            if (this.onChatMessage) this.onChatMessage(chatter, message, false);
        });
        this.client.on("action", (userData: UserData, message: string) => {
            var chatter = this.getChatter(userData);
            if (this.onChatMessage) this.onChatMessage(chatter, message, true);
        });
    }

    /**
     * Called when a user joins the chat.
     */
    onUserJoin: (user: Chatter) => void;
    /**
     * Called when a user leaves the chat.
     */
    onUserPart: (user: Chatter) => void;
    /**
     * Called when a chat message is recieved.
     */
    onChatMessage: (user: Chatter, message: string, isAction: boolean) => void;

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
        var name: string, rank = Ranks["new"];
        
        if (typeof data == "object") {
            var userData = data as UserData;
            name = userData.name || userData["display-name"];
            if ("mod" in userData) rank = userData.mod ? Ranks.mod : Ranks["new"];
        } else if (typeof data == "string") name = data as string;
        name = name.toLowerCase();

        var result = this.chatters.where({ name: name }).findOne();

        if (name == this.username.toLowerCase()) rank = Ranks.bot;
        else if (name == this.channel.toLowerCase()) rank = Ranks.channel;

        if (result) {
            if (rank != result.rank) result.rank = rank, result.save();
        } else if (!result) {
            result = this.chatters.insert({
                name: name,
                rank: rank
            });
        }

        return result;
    }

    /**
     * When a user joins the chat.
     */
    private join (chatter: string | UserData) {
        var ch = this.getChatter(chatter);
        ch.chatting = true;
        ch.save();
    }
    /**
     * When a user leaves the chat.
     */
    private part (chatter: string | UserData) {
        var ch = this.getChatter(chatter);
        ch.chatting = false;
        ch.save();
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
        var user: string = typeof to == "string" ? to as string : (to as Chatter).name;
        this.client.whisper(user, ...what);
    }
}

export class Chatter extends Document {
    public name: string;
    public rank: number;
    public displayName: string;
    public chatting: boolean;
    public time: number;
    public firstJoin: Date;
}
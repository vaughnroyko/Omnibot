import { Database, Collection, Schema, Document } from "typego";

import Rank = require("./Rank");

export interface UserData {
    name: string;
    "display-name"?: string;
    mod?: boolean;
}

export class Chatters {
    private collection: Collection<Chatter>;
    constructor(private database: Database, private channel: string, private botName: string) {
        this.collection = database.collection<Chatter>("chatters", {
            name: { type: String, unique: true },
            displayName: { type: String, fillWith: "name" },
            rank: { type: Number, default: Rank.new },
            chatting: { type: Boolean, default: false },
            firstJoin: { type: Date, generator: () => Date.now() },
            time: { type: Number, default: 0 }
        });
    }
    get (data: string | UserData): Chatter {
        var name: string, rank = Rank.new;
        if (typeof data == "object") {
            var userData = data as UserData;
            name = userData.name || userData["display-name"];
            if ("mod" in userData) rank = userData.mod ? Rank.mod : Rank.new;
        } else if (typeof data == "string") name = data as string;

        var result = this.collection.where({ name: name }).findOne();

        if (name == this.botName) rank = Rank.bot;
        else if (name == this.channel) rank = Rank.channel;

        if (result) {
            if (rank != result.rank) result.rank = rank, result.save();
        } else if (!result) {
            result = this.collection.insert({
                name: name,
                rank: rank
            });
        }

        return result;
    }
    join (chatter: string | UserData) {
        var ch = this.get(chatter);
        ch.chatting = true;
        ch.save();
    }
    part (chatter: string | UserData) {
        var ch = this.get(chatter);
        ch.chatting = false;
        ch.save();
    }
    list () {
        return this.collection.where({chatting: true}).find();
    }
    static ranks = Rank;
    static getRank (rank: string | number) {
        var result: number;
        if (typeof rank == "string" && rank in Rank) result = (Rank as any)[rank];
        if (typeof rank != "number") return Rank.new;
        return Math.clamp(Math.floor(result), Rank.new, Rank.bot);
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

/*
export class Chatter {

    public name: string;
    public rank: number;
    public displayName: string;
    public chatting: boolean;
    public time: Date;

    constructor(name: string, rank?: string | number) {
        super();
        //if (typeof name == "object" && name.constructor.name == "model") {
        //    this.stored = name;
        //} else {
        this.name = name.toLowerCase(), this.displayName = this.name;
        this.rank = typeof rank == "string" && rank in Rank ? (Rank as any)[rank] : typeof rank == "number" ? rank : Rank.new;
        //}
    }

    load (table: Table): boolean {
        if (this.rank < Rank.channel) {
            var result = table.where({name: this.name}).findSync(1);
            if (!result) return false;
            this.stored = result;
            this.name = result.name;
            this.rank = result.rank;
            this.displayName = result.displayName;
            this.time = result.time;
        }
        return true;
    }
    save (table?: Table): boolean {
        if (this.rank < Rank.channel) {
            if (this.stored) {
                this.stored["displayName"] = this.displayName;
                this.stored["rank"] = this.rank;
                this.stored["chatting"] = this.chatting;
                this.stored["time"] = this.time;
            } else if (table) {
                this.stored = new table.row({
                    name: this.name,
                    displayName: this.name,
                    rank: this.rank,
                    chatting: true,
                    firstJoin: Date.now() / 1000 | 0,
                    time: 0
                });
            } else return false;
            this.stored.saveSync();
        }
        return true;
    }
}*/
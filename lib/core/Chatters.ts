import { Query, Table, Database, Document } from "../util/database";

import Rank = require("./Rank");

export class Chatters {
    private table: Table;
    constructor(private database: Database, private channel: string, private botName: string) {
        this.table = database.table("chatters", {
            name: String,
            displayName: String,
            rank: Number,
            chatting: Boolean,
            firstJoin: Number,
            time: Number
        });
    }
    find (data: Chatter | string | any) {
        var result: Chatter;
        if (typeof data == "object") {
            if (data instanceof Chatter) result = data;
            else result = new Chatter(data["name"] || data["display-name"], data.mod ? 2 : 0);
        }
        if (typeof data == "string") result = new Chatter(data, Rank["new"]);
        if (result) {
            result.load(this.table);

            if (result.name == this.botName) result.rank = Rank.bot;
            else if (result.name == this.channel) result.rank = Rank.channel;
            if (typeof data == "object" && "display-name" in data) result.displayName = data["display-name"];

            result.save(this.table);
            return result;
        }
    }
    join (chatter: Chatter | string | any) {
        chatter = this.find(chatter);
        chatter.chatting = true;
        chatter.save(this.table);
    } 
    part (chatter: Chatter | string | any) {
        chatter = this.find(chatter);
        chatter.chatting = true;
        chatter.save(this.table);
    } 
    list () {
        var chatters = this.table.where({chatting: true}).findSync(), result: Chatter[] = [];
        for (var chatter of chatters) result.push(this.find(chatter));
        return result;
    }
    static ranks = Rank;
    static getRank (rank: string | number) {
        var result: number;
        if (typeof rank == "string" && rank in Rank) result = (Rank as any)[rank];
        if (typeof rank != "number") return Rank.new;
        return Math.clamp(Math.floor(result), Rank.new, Rank.bot);
    }
}

export class Chatter {

    public name: string;
    public rank: number;
    public displayName: string;
    public chatting: boolean;
    public stored: Document;
    public time: Date;

    constructor(name: string, rank?: string | number) {
        /*if (typeof name == "object" && name.constructor.name == "model") {
            this.stored = name;
        } else {*/
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
}
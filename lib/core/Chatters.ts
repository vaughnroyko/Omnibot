import { Query, Table, Database, Document } from "../util/database";
var season = require("season");

import ranks = require("./ranks");

export class Chatters {
    public table: Table;
    constructor(public database: Database) {
        this.table = database.table("chatters", {
            name: String,
            displayName: String,
            rank: Number,
            chatting: Boolean,
            firstJoin: Number,
            time: Number
        });
    }
    new (name: string, rank: string | number): Chatter {
        var c = new Chatter(name, rank);
        return c;
    }
    get (data: Chatter | string | any) {
        var result: Chatter;
        if (typeof data == "object") {
            if (data instanceof Chatter) result = data;
            else result = new Chatter(data["name"] || data["display-name"], data.mod ? 2 : 0);
            result.load(this.table);
        }
        if (typeof data == "string") result = new Chatter(data, ranks["new"]);
        if (result) {
            //if (result.name == identity) result.rank = ranks.bot;
            //else if (result.name == channel) result.rank = ranks.channel;
            if (typeof data == "object" && "display-name" in data) result.displayName = data["display-name"];
            result.save(this.table);
            return result;
        }
    }
    join (chatter: Chatter | string | any) {
        chatter = this.get(chatter);
        chatter.chatting = true;
        chatter.save(this.table);
    } 
    part (chatter: Chatter | string | any) {
        chatter = this.get(chatter);
        chatter.chatting = true;
        chatter.save(this.table);
    } 
    list () {
        var chatters = this.table.where({chatting: true}).findSync(), result: Chatter[] = [];
        for (var chatter of chatters) result.push(this.get(chatter));
        return result;
    }
    static ranks = ranks;
    static getRank (rank: string | number) {
        var result: number;
        if (typeof rank == "string" && rank in ranks) result = (ranks as any)[rank];
        if (typeof rank != "number") return ranks.new;
        return Math.clamp(Math.floor(result), ranks.new, ranks.bot);
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
        this.rank = typeof rank == "string" && rank in ranks ? (ranks as any)[rank] : typeof rank == "number" ? rank : ranks.new;
        //}
    }
    load (table: Table): boolean {
        var result = table.where({name: this.name}).findSync(1);
        if (!result) return false;
        this.stored = result;
        return true;
    }
    save (table?: Table): boolean {
        if (this.stored) {
            //this.stored["name"] = this.name;
            this.stored["displayName"] = this.displayName;
            this.stored["rank"] = this.rank;
            this.stored["chatting"] = this.chatting;
            //this.stored["time"] = this.time;
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
        return true;
    }
}
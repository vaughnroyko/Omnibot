/// <reference path="../../typings/mongoose.d.ts" />

import mongoose = require("mongoose");
var sync = require("synchronicity");

declare module "mongoose" {
    export module Document {
        export var prototype: any;
    }
}

mongoose.Document.prototype.edit = function (data: any, callback: Function) {
    this.constructor.update(
        {_id: this._id},
        data,
        function () {
            if (typeof callback == "function") callback.apply(null, arguments);
        }
    );
};
mongoose.Document.prototype.saveSync = function () {
    return sync.wait(this, "save");
};

export type resultCallback = (result: any) => void;
export class Query {

    constructor (public table: Table, public conditions: Object) {}

    find (callback: resultCallback): mongoose.Promise<mongoose.Document[]>;
    find (limit: number, callback: resultCallback): mongoose.Promise<mongoose.Document[]>;
    find (limit: number | resultCallback, callback?: resultCallback): mongoose.Promise<mongoose.Document[]> {
        var q = this.table.row.find(this.conditions);
        if (typeof limit == "function") callback = limit as resultCallback;
        else if (typeof limit == "number") q = q.limit(limit as number);
        return q.exec((_e, result) => callback(limit === 1 ? (result.length == 0 ? false : result[0]) : result));
    }
    findSync (limit?: number) {
        var q = this.table.row.find(this.conditions);
        if (typeof limit == "number") q = q.limit(limit);
        var result = sync.wait(q, "exec", [sync.defer("result")]);
        return limit === 1 ? (result.length == 0 ? false : result[0]) : result;
    }
}

export class Table {

    row: mongoose.Model<mongoose.Document>;

    constructor (private name: string, schema: Object) {
        this.row = mongoose.model(name, new mongoose.Schema(schema));
    }
    
    where (conditions: Object) {
        return new Query(this, conditions);
    }
}

module mongo {
    export var path: string;
    export var connection: Object;
}

export class Database {
    tables: { [key: string]: Table };
    constructor (public name: string) {}

    table (name: string, schema: Object) {
        if (typeof name != "string" || typeof schema != "object") throw new TypeError;
        return this.tables[name] = new Table(this.name + "." + name, schema);
    }

    static connect (path: string, connection: Object) {
        path = path, connection = connection;
        sync.wait(mongoose, 'connect', [mongo.path, mongo.connection, sync.defer()]);
    }
}
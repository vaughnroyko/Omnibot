/// <reference path="../../typings/mongoose.d.ts" />

import mongoose = require("mongoose");
var sync = require("synchronicity");

export interface Document extends mongoose.Document {
    [key: string]: any;
    saveSync(): void;
    edit(data: any, callback?: Function): void;
}

export type resultCallback = (result: any) => void;
export class Query {

    constructor (public table: Table, public conditions: Object) {}

    find (callback: resultCallback): mongoose.Promise<Document[]>;
    find (limit: number, callback: resultCallback): mongoose.Promise<Document[]>;
    find (limit: number | resultCallback, callback?: resultCallback): mongoose.Promise<Document[]> {
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

    row: mongoose.Model<Document>;

    constructor (private name: string, schema: Object) {
        this.row = mongoose.model(name, new mongoose.Schema(schema)) as any;
    }
    
    where (conditions: Object) {
        return new Query(this, conditions);
    }
}

export class Database {
    tables: { [key: string]: Table };
    constructor (public name: string, public path: string, public connection: Object) {
        this.tables = {};
    }

    table (name: string, schema: Object) {
        if (typeof name != "string" || typeof schema != "object") throw new TypeError;
        return this.tables[name] = new Table(this.name + "." + name, schema);
    }

    connect () {
        sync.wait(mongoose, 'connect', [this.path, this.connection, sync.defer()]);
    }
}
export module Database {
    export function init () {
        var m = mongoose as any;
        m.Document.prototype.edit = function (data: any, callback?: Function) {
            this.constructor.update(
                {_id: this._id},
                data,
                function (...args: any[]) {
                    if (typeof callback == "function") callback(...args);
                }
            );
        };
        m.Document.prototype.saveSync = function () {
            return sync.wait(this, "save");
        };
    }
}
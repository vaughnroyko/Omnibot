var mongoose = require("mongoose");
var sync = require("synchronicity");

mongoose.Document.prototype.edit = function (data, callback) {
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

mongoose.model('banana.users', mongoose.Schema({
    name: String,
    time: Number,
    create: Date,
    rank: Number,
    chatting: Boolean,
    displayName: String
}))


var query = function (table, conditions) {
    this.table = table, this.conditions = conditions;
};

query.prototype = {
    find: function (limit, callback) {
        var q = this.table.row.find(this.conditions);
        if (typeof limit == "function") callback = limit;
        else if (typeof limit == "number") q = q.limit(limit);
        return q.exec((_e, result) => callback(limit === 1 ? (result.length == 0 ? false : result[0]) : result));
    },
    findSync: function (limit) {
        var q = this.table.row.find(this.conditions);
        if (typeof limit == "function") callback = limit;
        else if (typeof limit == "number") q = q.limit(limit);
        var result = sync.wait(q, "exec", [sync.defer("result")]);
        return limit === 1 ? (result.length == 0 ? false : result[0]) : result;
    }
};

var table = function (name, schema) {
    this.row = mongoose.model(name, mongoose.Schema(schema));
};

table.prototype = {
    where: function (conditions) {
        return new query(this, conditions);
    }
};

var mongo = {};
var database = module.exports = function (name) {
    if (typeof name != "string") throw new TypeError;
    this.name = name;
    this.tables = {};
};

database.connect = function (path, connection) {
    mongo.path = path, mongo.connection = connection;
    sync.wait(mongoose, 'connect', [mongo.path, mongo.connection, sync.defer()]);
};

database.prototype = {
    table: function (name, schema) {
        if (typeof name != "string" || typeof schema != "object") throw new TypeError;
        return this.tables[name] = new table(this.name + "." + name, schema);
    }
};
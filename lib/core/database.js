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

var query = function (table, conditions) {
    this.table = table, this.conditions = conditions;
};

query.prototype = {
    find: function () {
        
    }
};

var table = function (name, schema) {
    this.model = mongoose.model(name, mongoose.Schema(schema));
};

table.prototype = {
    where: function () {

    }
};

var database = module.exports = function (name) {
    this.name = name;
    this.tables = {};
};

database.prototype = {
    addTable: function (name, schema) {
        return this.tables[name] = new table(this.name + "." + name, schema);
    }
};
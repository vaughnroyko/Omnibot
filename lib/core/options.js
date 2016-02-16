var path = require("path");
var season = require("season");
var _ = require("underscore-plus");
var fs = global.fs ? global.fs : require("./fs.js");

var loadOptions = function (folder, which) {
    var result = {};
    for (var i = 0; i < which.length; i++) {
        var file = path.join(folder, which[i]);
        if (!fs.existsSync(file)) fs.writeFileSync(file, "");
        var obj = season.readFileSync(file);
        if (obj) result[which[i].split(".").shift()] = obj;
    }
    return result;
}

var Options = function (folder) {
    folder += "/";
    var list = fs.readdirSync(folder + "defaults"), // list of all default option files
        defaults = loadOptions(folder + "defaults", list); // default options

    Object.defineProperties(this, {
        list: {
            get: () => list
        },
        defaults: {
            get: () => defaults
        },
        folder: {
            get: () => folder
        }
    });
};

Options.prototype = {
    load: function () {
        return _.deepExtend({}, this.defaults, loadOptions(this.folder, this.list));
    }
};

module.exports = Options;
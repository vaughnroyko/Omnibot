var fs = require("fs-extra");
var sync = require("synchronicity");

fs.tryReadSync = function () {
    try {
        var result = fs.readFileSync.apply(fs, Array.prototype.slice.apply(arguments, [0, -1]));
    } catch (err) {
    	if (err.code != "ENOENT") throw err;
    }
    return arguments[arguments.length - 1].apply(null, [result]);
};

fs.moveSync = function (source, dest, options) {
    return sync.wait(fs, "move", [source, dest, options === undefined ? {} : options, sync.defer()]);
};

module.exports = fs;
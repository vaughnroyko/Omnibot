var fs = require("fs-extra");

fs.readFileThenSync = function () {
    try {
        arguments[arguments.length - 1].apply(null, [
            fs.readFileSync.apply(fs, Array.prototype.slice.apply(arguments, [0, -1]))
        ]);
    } catch (err) {
    	if (err.code != "ENOENT") throw err;
    }
};

module.exports = fs;
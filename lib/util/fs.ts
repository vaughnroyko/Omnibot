/// <reference path="./fs.d.ts" />
import fs = require("fs-extra");

let sync = require("synchronicity");

fs.tryReadSync = function () {
    let result: any;
    try {
        result = fs.readFileSync.apply(fs, Array.prototype.slice.apply(arguments, [0, -1]));
    } catch (err) {
    	if (err.code != "ENOENT") throw err;
    }
    return result;
};

fs.moveSync = function (source: string, dest: string) {
    return sync.wait(fs, "move", [source, dest, {}, sync.defer()]);
};

export = fs;
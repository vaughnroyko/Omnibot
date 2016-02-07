'use strict';

var exit = process.exit.bind(process, 1);

process.stdin.resume();
process.on('SIGINT', exit);

global.packages = {};

var season = require("season");
var _ = require("underscore-plus");
var path = require("path");

require("weaving").applyProtos(true);

var fs = global.packages.fs = require("./util/fs.js");
var logger = require("./util/logger.js");
var database = require("./util/database.js");

process.on('uncaughtException', function () {
    exit();
});


var debug = {
	isLive: false
};
fs.readFileThenSync("lib/debug.cson", function (contents) {
    debug = _.deepExtend(debug, contents);
});

console.log(debug);

while (true);
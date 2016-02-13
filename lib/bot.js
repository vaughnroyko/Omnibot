// variable pre-initialization (so it doesn't error when trying to use them before they're defined)

var fs, logger, database;


// set up process basics

(function () {
    var exit = process.exit.bind(process, 1);

    process.stdin.resume();
    process.on('SIGINT', exit);

    var timeout = function (time, callback) {
        if (typeof time == "number" && typeof callback == "function") timeout.time = time, timeout.callback = callback;
        else {
            if (timeout.time == 0) timeout.callback();
        }
        timeout.time -= 1;
        setTimeout(timeout, 1000);
    };

    process.on('uncaughtException', function (err) {
        console.log(err.stack);
        try {
            if (typeof logger == "object") {
                logger.selected = "error.log";
                logger.log(err.stack);
            }
        } catch (err) {
            console.log("Issue using logger.");
        }
        timeout(5, exit);
    });
})();


// load needed modules

var season = require("season");
var _ = require("underscore-plus");
var path = require("path");

require("weaving").applyProtos(true);

global.packages = {};


// load core library

fs = global.packages.fs = require("./core/fs.js");

logger = new (require("./core/logger.js"))("logs");
logger.selected = "bot.log";

database = require("./core/database.js");


// load debug options

var debug = {
	isLive: false
};
fs.readFileThenSync("lib/debug.cson", function (contents) {
    debug = _.deepExtend(debug, contents);
});


// bot START!

logger.logTo("test.log", debug);

setInterval(function () {
    logger.log("test");
}, 1000);
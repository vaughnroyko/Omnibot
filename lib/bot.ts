/// <reference path="../typings/weaving.d.ts" />

// variable pre-initialization (so it doesn't error when trying to use them before they're defined)
import { Logger } from "./core/Logger";
var logger: Logger;
import { Database } from "./util/Database";
var database: Database;


// set up the process basics--consolemate, arguments, etc
import { Process, Arguments, Console, Timeline } from "consolemate";

Process.on.error("logger", function (err: Error) {
    var success = false;
    try {
        if (typeof logger == "object") {
            logger.timestamp = false;
            logger.logTo("error.log", err.stack);
            success = true;
        }
    } catch (_e) {}
    if (!success) {
        console.log("Issue using logger.");
        console.log(err.stack);
    }
    return success;
});


Console.input.advanced(true);
Console.clear();


var argReader = new Arguments.Reader;
argReader.flagAliases = {
    "developer|dev|d": "developer",
    "channel": "> 1"
};
argReader.throwIfArgumentsIncorrect = true;

var { options, flags, args } = argReader.read();


// load needed modules

//var _ = require("underscore-plus");
var weaving = require("weaving");
weaving.library.add(require("weaving-chalk"));
weaving.applyProtos(true);


// load core library

database = new Database(options.channel);
logger = new Logger("logs");


Console.input.enable();
Console.onLine = function (line: string) {
    
};
// process


var exit = process.exit.bind(process);
process.onExit = {};
process.onError = function (err) {
    console.log(err.stack);
};
process.exit = function (code) {
    if (typeof process.onExit == "object") {
        for (var k in process.onExit) {
            if (typeof process.onExit[k] == "function") try {
                process.onExit[k](code);
            } catch (err) {
                process.onError(err);
            }
        }
    }
    exit(code);
};

// TODO figure out a better way to do this
var timeout = function (time, callback) {
    if (typeof time == "number" && typeof callback == "function") timeout.time = time, timeout.callback = callback;
    else {
        if (timeout.time == 0) timeout.callback();
    }
    timeout.time -= 1;
    setTimeout(timeout, 1000);
};

process.on('uncaughtException', function (err) {
    process.onError(err);
    // TODO @stats -> error (if database is connected!)
    timeout(5, () => exit(1));
});

process.onReady = process.onConnecting = function () {};

// console
process.on('SIGINT', process.exit);

console.clear = () => process.stdout.write("\u001b[2J\u001b[0;0H\033c");
console.newline = (count) => process.stdout.write("\n".repeat(typeof count == "number" ? count : 1));

var clog = console.log, hascontent = false;
console.logLine = function () {
    if (hascontent) process.stdout.clearLine(), process.stdout.cursorTo(0);
    clog.apply(console, arguments);
    if (hascontent) process.stdout.write(console.input.line);
};
var util = require("util");
console.log = function () {
    var str = "";
    for (var a of arguments) str += " " + (typeof a == "string" ? a : util.inspect(a));
    process.stdout.write(str.slice(1));
};

var sync = require("synchronicity");

console.readLine = function () {
    process.stdin.resume();
    var result = sync.wait(process.stdin, "once", ["data", sync.defer("result")], [sync.noError]).toString();
    process.stdin.pause();
    return result;
};
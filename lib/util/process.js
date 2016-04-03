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


// console

process.stdin.setRawMode(true);
process.stdin.setEncoding("utf8");

process.stdin.on('data', function (key) {
    if (key === '\u0003') process.exit();
    if (console.input.visible) process.stdout.write(key);
});

console.clear = () => process.stdout.write("\u001b[2J\u001b[0;0H\033c");

console.input = {
    resume: function () {
        process.stdin.resume();
    },
    visible: true
};
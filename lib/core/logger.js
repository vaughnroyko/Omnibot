var fs = global.fs ? global.fs : require("./fs.js");
var path = require("path");
var util = require("util");
var sync = require("synchronicity");

var logger = module.exports = function (folder) {
    folder = path.resolve(process.cwd(), folder);
    fs.mkdirs(folder);

    this.folder = folder, this.selected = undefined;

    var exists;
    if (exists = fs.existsSync(this.folder + "/last") && fs.readdirSync(this.folder + "/last").length > 0) {
        var t = new Date(fs.statSync(this.folder + "/last").mtime);
        var formats = {
            date: "{year}-{month}-{date}",
            time: "{hour}.{minute}.{second}"
        };
    	var currentFolder = this.folder + "/" + logger.getTimestamp(t, formats.date);
        fs.moveSync(this.folder + "/last", currentFolder + "/" + logger.getTimestamp(t, formats.time));
        exists = false;
    }
    if (!exists) {
        var i = 0, err, max = 10, delay = 100;
        do {
            try {
                fs.mkdirsSync(this.folder + "/last");
                break;
            } catch (e) {
                if (e.code != "EPERM") throw e;
                err = e;
            }
            sync.sleep(delay);
        } while (i++ < max);
        if (i > 0) {
            if (i > max) throw err;
            console.log("Momentary, resolved file issue. " + i + " (Disregard)");
        }
    }
};

var months = [
    "January", "February", "March",
    "April", "May", "June",
    "July", "August", "September",
    "October", "November", "December"
];

logger.getTimestamp = function (time, format) {
    if (!time || typeof time != "object" || time.constructor.name != "Date") time = new Date;
    if (format === undefined) format = "{year}-{month}-{date} {hour}:{minute}:{second}";
    var hr = String(time.getHours().toString().padLeft(2, '0'));
    hr.short = (time.getHours() - 1) % 12 + 1;
    return format.weave({
        year: time.getFullYear(),
        month: (time.getMonth() + 1).toString().padLeft(2, '0'),
        monthName: months[time.getMonth()],
        date: time.getDate().toString().padLeft(2, '0'),
        hour: hr,
        minute: time.getMinutes().toString().padLeft(2, '0'),
        second: time.getSeconds().toString().padLeft(2, '0'),
        anteMeridiem: time.getHours() > 11,
        postMeridiem: time.getHours() < 12
    });
};

logger.prototype = {
    log: function () {
        if (typeof this.selected == "string") {
            var args = Array.prototype.slice.call(arguments);
            args.unshift(this.selected);
            this.logTo.apply(this, args);
        }
    },
    logTo: function (selection) {
        var result = "", args = Array.prototype.slice.apply(arguments, [1]);

        for (var i = 0; i < args.length; i++)
            result += " " + (typeof args[i] == "string" ? args[i] : util.inspect(args[i]));

        result = (this.timestamp ? logger.getTimestamp(undefined,
            typeof this.timestampFormat == "string" ? this.timestampFormat : "{hour}:{minute}:{second}"
        ) + " " : "") + result.slice(1);

        console.logLine(result);
        fs.appendFileSync(this.folder + "/last/" + selection, "{#strip:{0}}\n".weave(result), "utf8");
    },
    withTimestamp: function (code, ts) {
        var timestamp = this.timestamp; this.timestamp = ts === undefined ? true : !!ts;
        code();
        this.timestamp = timestamp;
    }
}
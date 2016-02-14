var fs = global.packages.fs;
var path = require("path");
var util = require("util");

var logger = module.exports = function (folder) {
    folder = path.resolve(process.cwd(), folder);
    fs.mkdirs(folder);

    this.folder = folder, this.selected = undefined;

    if (fs.existsSync(this.folder + "/last")) {
        var t = new Date(fs.statSync(this.folder + "/last").mtime);
        var formats = {
            date: "{year}-{month}-{date}",
            time: "{hour}.{minute}.{second}"
        };
    	var currentFolder = this.folder + "/" + logger.getTimestamp(t, formats.date);
        fs.moveSync(this.folder + "/last", currentFolder + "/" + logger.getTimestamp(t, formats.time));
    }
    fs.mkdirsSync(this.folder + "/last");
};

logger.getTimestamp = function (time, format) {
    if (!time || typeof time != "object" || time.constructor.name != "Date") time = new Date;
    if (format === undefined) format = "{year}-{month}-{date} {hour}:{minute}:{second}";
    var hr = String(time.getHours().toString().padLeft(2, '0'));
    hr.short = (time.getHours() - 1) % 12 + 1;
    return format.weave({
        year: time.getFullYear(),
        month: (time.getMonth() + 1).toString().padLeft(2, '0'),
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

        result = result.slice(1);

        try {
            fs.appendFileSync(this.folder + "/last/" + selection, result + "\n", "utf8");
        } catch (err) {
            throw err;
        }
        console.log(result);
    }
}
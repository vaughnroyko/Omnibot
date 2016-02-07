var fs = global.packages.fs;
var path = require("path");

var logger = module.exports = function (folder) {
    folder = path.resolve(process.cwd(), folder);
    console.log(folder);
    fs.mkdirs(folder);
    this.folder = folder;

    if (fs.existsSync(this.folder + "/last")) {
        var t = new Date(fs.statSync(this.folder + "/last").mtime);
        var formats = {
            date: "{year}-{month}-{date}",
            time: "{hour}.{minute}.{second}"
        };
    	var currentFolder = this.folder + "/" + logger.getTimestamp(formats.date);
    	fs.mkdirs(currentFolder);
    	fs.renameSync(this.folder + "/last/bot.log", currentFolder + "/" + logger.getTimestamp(formats.time) + ".log");
    }
    try {
        fs.unlinkSync(this.folder + "/last/debug.log");
    } catch (err) {
        if (err.code != "ENOENT") throw err;
    }
};

logger.getTimestamp = function (format) {
    if (format === undefined) format = "{year}-{month}-{date} {hour}:{minute}:{second}";
    var now = new Date();
    var hr = now.getHours().toString().padLeft(2, '0');
    hr.short = (now.getHours() - 1) % 12 + 1;
    return format.weave({
        year: now.getFullYear(),
        month: (now.getMonth() + 1).toString().padLeft(2, '0'),
        date: now.getDate().toString().padLeft(2, '0'),
        hour: hr,
        minute: now.getMinutes().toString().padLeft(2, '0'),
        second: now.getSeconds().toString().padLeft(2, '0'),
        anteMeridiem: now.getHours() > 11,
        postMeridiem: now.getHours() < 12
    });
};
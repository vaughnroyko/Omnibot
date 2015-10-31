
var request = global.modules.request;

var options = global.options;
var styles = global.styles;

module.exports = {
    getTimestamp: function (format) {
        if (format === undefined) format = options.output.messages.timestamp.format;
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
            meridiem: now.getHours() > 11 ? options.output.messages.timestamp.pm : options.output.messages.timestamp.am
        });
    },
    isLive: function () {
        return !!global.bot.data.stream || global.debug.isLive;
    }
};
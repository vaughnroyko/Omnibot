
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

String.prototype.reverse = function () {
    var result = "";
    for (var i = this.length - 1; i >= 0; i--) {
        result += this.charAt(i);
    }
    return result;
};

String.prototype.startsWith = function (substr) {
    return this.indexOf(substr, 0) === 0;
};
String.prototype.endsWith = function (substr) {
    return this.indexOf(substr, this.length - substr.length) !== -1;
};
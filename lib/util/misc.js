
var request = global.modules.request;

var options = global.options;
var styles = global.styles;

module.exports = {
    getTimestamp: function () {
        var now = new Date();
        return options.output.messages.timestamp.format.weave(
            now.getHours().toString().padLeft(2, '0'), // hours 0-24
            (now.getHours() - 1) % 12 + 1, // hours 1-12
            now.getMinutes().toString().padLeft(2, '0'), // minutes
            now.getSeconds().toString().padLeft(2, '0'), // seconds
            now.getHours() > 11 ? options.output.messages.timestamp.pm : options.output.messages.timestamp.am // am|pm
        );
    },
    isLive: function () {
        return !!global.bot.data.stream || global.debug.isLive;
    }
};
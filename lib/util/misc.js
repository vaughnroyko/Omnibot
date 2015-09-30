
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
    getData: function () {
        request('https://api.twitch.tv/kraken/streams/' + global.bot.channel, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                global.bot.channelData = JSON.parse(body);
            } else {
                console.log(styles);
                util.chatter.log(null, styles.console.error(error));
            }
        });
    },
    isLive: function () {
        return !!global.bot.channelData.stream || global.debug.isLive;
    }
};

var chalk = global.modules.chalk;
var fs = global.modules.fs;

var options = global.options;
var util = global.util;
var ranks = global.data.ranks;
var viewers = global.util.viewers;

if (fs.existsSync("logs/last/bot.log")) {
    var t = new Date(fs.statSync("logs/last/bot.log").mtime);
    var formatTime = function (str) {
        return str.format(
			t.getFullYear(),
			(t.getMonth() + 1).toString().padLeft(2, '0'),
			t.getDate().toString().padLeft(2, '0'),
			t.getHours().toString().padLeft(2, '0'),
			t.getMinutes().toString().padLeft(2, '0'),
			t.getSeconds().toString().padLeft(2, '0')
        );
    };
    var formats = {
        date: "{0}-{1}-{2}",
        time: "{3}.{4}.{5}"
    };
	var currentFolder = "logs/" + formatTime(formats.date);
	fs.mkdirs(currentFolder);
	fs.renameSync("logs/last/bot.log", currentFolder + "/" + formatTime(formats.time) + ".log");
}
try {
    fs.unlinkSync("logs/last/debug.log");
} catch (err) {
    if (err.code != "ENOENT") throw err;
}


var regexes = {
    keywords: "{0..?\\b({0*|:({&})})\\b}".weave(options.core.keywords).toLowerCase(),
    greetings: "{0..?\\b({0*|:({&})})\\b}".weave(options.salutations.greetings).toLowerCase(),
    farewells: "{0..?\\b({0*|:({&})})\\b}".weave(options.salutations.farewells).toLowerCase()
};

var chatter;
module.exports = chatter = {
    listen: function (channel, ircUser, message) {
        var user = util.viewers.get(user.username);
        if (user.name != options.twitch.identity.username) {
            if (!user.chatting) user = util.viewers.beginJoin(user.name, {rank: 0});
            viewers.updateDisplayName(user.name, ircUser.displayName);
            chatter.run.message(user, message);
        }
    },
    log: function (user) {
        var args = [].slice.call(arguments, 0);
        args.splice(0, 1);
        var message = args.join(' ');
        var timestamp = util.getTimestamp();
        message = styles.console.info(options.output.messages.format.weave(timestamp, typeof user == "string" ? {name: user, displayName: user} : user, message));
        fs.appendFileSync("logs/last/bot.log", chalk.stripColor(message + "\n"));
        console.log(message);
    },
    say: function (message) {
        global.bot.client.say(global.bot.channel, chalk.stripColor(message));
        if (options.output.messages.showBotChatMessagesInConsole) {
            chatter.log(options.twitch.identity.username, styles.bot(message));
        }
    },
    run: {
        message: function (user, message) {
            if (message[0] == options.core.prefixes.basic) {
                chatter.run.command(user, message);
            } else {

                var lwr = message.toLowerCase();

                if (regexes.keywords.length > 0 && lwr.search(regexes.keywords) > -1)
                    util.chatter.log(user, styles.keyword(message));
                else if (regexes.greetings.length > 0 && lwr.search(regexes.greetings) > -1)
                    util.chatter.log(user, styles.greeting(message));
                else if (regexes.farewells.length > 0 && lwr.search(regexes.farewells) > -1)
                    util.chatter.log(user, styles.farewell(message));
                else {
                    var style;
                    if (user.rank >= ranks.broadcaster) style = styles.broadcaster;
                    else if (user.rank >= ranks.mod) style = styles.moderator;
                    else style = styles.user;
                    util.chatter.log(user, style(message));
                }
            }
        },
        command: function (user, message, hide) {
            if (options.output.messages.showCommandCalls && !hide) util.chatter.log(user.name, styles.event.command(message));
            message = message.split(' ');
            var commandName = message[0].substring(1);
            if (commandName.length > 0) {
                if (commandName in bot.commands) {
                    user = global.util.viewers.get(user);
                    command = bot.commands[message[0].substring(1)];
                    command.apply(null, [user].concat(message.slice(1)));
                } else {
                    if (options.output.logCommandFails) util.chatter.log(null, user.name + " tried to run the command '" + message[0].substring(1) + "' but it doesn't exist!");
                }
            }
        }
    }
};

chatter.log.debug = function (message) {
	fs.appendFileSync("logs/last/debug.log", chalk.stripColor(message + "\n"));
};
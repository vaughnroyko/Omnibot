
var chalk = global.modules.chalk;
var fs = global.modules.fs;

var options = global.options;
var util = global.util;
var ranks = global.data.ranks;
var viewers = global.util.viewers;

if (fs.existsSync("logs/last/bot.log")) {
    var t = new Date(fs.statSync("logs/last/bot.log").mtime);
    var formats = {
        date: "{year}-{month}-{date}",
        time: "{hour}.{minute}.{second}"
    };
	var currentFolder = "logs/" + util.getTimestamp(formats.date);
	fs.mkdirs(currentFolder);
	fs.renameSync("logs/last/bot.log", currentFolder + "/" + util.getTimestamp(formats.time) + ".log");
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

var emit = function (message) {
    fs.appendFileSync("logs/last/bot.log", chalk.stripColor(message + "\n"));
    console.log(message);
};

var chatter;
module.exports = chatter = {
    connect: function () {
        global.bot.client.addListener('chat', chatter.listen);
        global.bot.client.addListener('action', function () {
            Array.prototype.push.apply(arguments, [true]);
            chatter.listen.apply(chatter, arguments);
        });
    },
    listen: function (channel, ircUser, message, bot, action) {
        var user = util.viewers.get(ircUser.username);
        if (user.name != global.bot.name) {
            if (!user.chatting) user = util.viewers.beginJoin(user.name, {rank: 0});
            viewers.updateDisplayName(user.name, ircUser['display-name']);
            user.displayName = ircUser['display-name'];
            viewers.updateSafe(user, {rank: viewers.util.getRank(ircUser['user-type'])})
            chatter.run.message(user, message, action ? true : false);
        }
    },
    log: function (user, action, message) {
        var timestamp = util.getTimestamp();
        message = styles.console.info(util.weave("messages.format", {
            time: timestamp,
            user: typeof user == "string" ? {name: user, displayName: user} : user,
            message: message,
            action: action
        }));
        emit(message);
    },
    print: function () {
        var message = Array.prototype.slice.call(arguments).join(" ");
        chatter.log(null, false, message);
    },
    say: function (message) {
        global.bot.client.say(global.bot.channel, chalk.stripColor(message));
        if (options.output.messages.showBotChatMessagesInConsole) {
            chatter.log(global.bot.name, false, styles.bot(message));
        }
    },
    run: {
        message: function (user, message, action) {
            if (message[0] == options.core.prefixes.basic) {
                chatter.run.command(user, message);
            } else {
                var style, lwr = message.toLowerCase();

                if (regexes.keywords.length > 0 && lwr.search(regexes.keywords) > -1) style = styles.keyword;
                else if (regexes.greetings.length > 0 && lwr.search(regexes.greetings) > -1) style = styles.greeting;
                else if (regexes.farewells.length > 0 && lwr.search(regexes.farewells) > -1) style = styles.farewell;
                else {
                    if (user.rank >= ranks.broadcaster) style = styles.broadcaster;
                    else if (user.rank >= ranks.mod) style = styles.moderator;
                    else style = styles.user;
                }

                chatter.log(user, action, style(message));
            }
        },
        command: function (user, message, hide) {
            if (options.output.messages.showCommandCalls && !hide) chatter.log(user, false, styles.event.command(message));
            message = message.split(' ');
            var commandName = message[0].substring(1);
            if (commandName.length > 0) {
                if (commandName in global.bot.commands) {
                    user = global.util.viewers.get(user);
                    command = global.bot.commands[message[0].substring(1)];
                    command.apply(null, [user].concat(message.slice(1)));
                } else {
                    if (options.output.logCommandFails) chatter.print(user.name + " tried to run the command '" + message[0].substring(1) + "' but it doesn't exist!");
                }
            }
        }
    }
};

chatter.log.debug = function (message) {
	fs.appendFileSync("logs/last/debug.log", chalk.stripColor(message + "\n"));
};
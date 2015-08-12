
var chalk = global.modules.chalk;
var fs = global.modules.fs;

var options = global.options;
var util = global.util;
var ranks = global.data.ranks;


var runMessage = function (user, message) {
    if (message[0] == options.core.prefixes.basic) {
        if (options.output.messages.showCommandCalls) util.chatter.log(user.name, styles.event.command(message));
        message = message.split(' ');
        if (message[0].substring(1) in bot.commands) {
            user = global.util.viewers.get(user);
            command = bot.commands[message[0].substring(1)];
            command.apply(null, [user].concat(message.slice(1)));
        } else {
            util.chatter.log(null, user.name + " tried to run the command '" + message[0].substring(1) + "' but it doesn't exist!");
        }
    } else {
        for (var i = 0; i < options.core.keywords.length; i++) {
            if (message.toLowerCase().search('\\b' + options.core.keywords[i] + '\\b') > -1) {
                util.chatter.log(user.name, styles.keyword(message));
                //TODO Growl notification
                return;
            }
        }

        for (var i = 0; i < options.salutations.greetings.length; i++) {
            if (message.toLowerCase().search('\\b' + options.salutations.greetings[i] + '\\b') > -1) {
                util.chatter.log(user.name, styles.greeting(message));
                //TODO Growl notification
                //https://github.com/tj/node-growl
                //https://github.com/azer/play-audio
                //http://www.paralint.com/projects/notifu/
                return;
            }
        }

        for (var i = 0; i < options.salutations.farewells.length; i++) {
            if (message.toLowerCase().search('\\b' + options.salutations.farewells[i] + '\\b') > -1) {
                util.chatter.log(user.name, styles.farewell(message));
                //TODO Growl notification
                return;
            }
        }

        var style;
        if (user.rank >= ranks.broadcaster) style = styles.broadcaster;
        else if (user.rank >= ranks.mod) style = styles.moderator;
        else style = styles.user;
        util.chatter.log(user.name, style(message));
    }
};

module.exports = {
    listen: function (channel, user, message) {
        user = util.viewers.get(user.username);
        if (user.name != options.twitch.identity.username) {
            if (!user.chatting) user = util.viewers.tryJoin(user.name, {rank: 0});
            runMessage(user, message);
        }
    },
    log: function (user) {
        var args = [].slice.call(arguments, 0);
        args.splice(0, 1);
        var message = args.join(' ');
        var timestamp = util.getTimestamp();
        if (user) {
            message = styles.console.info(options.output.messages.format.format(timestamp, user, message));
        } else {
            message = styles.console.info(options.output.messages.noUser.format(timestamp, message));
        }
        fs.appendFileSync("bot.log", chalk.stripColor(message + "\n"));
        console.log(message);
    },
    say: function (message) {
        global.bot.client.say(global.bot.channel, chalk.stripColor(message));
        if (options.output.messages.showBotChatMessagesInConsole) {
            this.log(options.twitch.identity.username, styles.bot(message));
        }
    }
};
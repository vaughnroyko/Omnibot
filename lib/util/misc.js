var userType = require('./userType.js');
var chalk = require('chalk');

module.exports = {
    host: null,

    isMod: function (username) {
        return username === this.host.channel.substring(1) || this.host.users[username] === userType.Moderator;
    },

    say: function (channel, message) {
        if (this.host.client !== null) {
            this.host.client.say(channel, message);
            console.log(chalk.yellow(message));
        } else {
            console.log(chalk.red("ur an idiot"));
        }
    }
};
var util = global.util;
var ranks = global.data.ranks;
var viewers = global.util.viewers;
var options = global.options;
var sync = global.modules.sync;

module.exports = {
    /*
      usage: !raffle <mininum rank=[0]> <maximum rank=[1]>
    */
    raffle: function (user, minRank, maxRank) {
        if (user.rank >= ranks.mod) {

            // Minimum defaults and checking
            if (!minRank) {
                minRank = 0;
            } else {
                minRank = parseInt(minRank, 10);
                if (minRank == NaN) {
                    minRank = 0;
                }
            }

            // Maximum defaults and checking
            if (!maxRank) {
                maxRank = 1;
            } else {
                maxRank = parseInt(maxRank, 10);
                if (maxRank == NaN) {
                    maxRank = 1;
                }
            }

            // Find a winner!

            // Make sure our user list is up to date
            viewers.sync();
            var users = viewers.getUsers({chatting: true, rank: {$gte: minRank, $lte: maxRank}}, false);
            if (users.length) {
                var randomUser = Math.floor(Math.random() * users.length);
                util.chatter.say(options.output.raffle.winner.weave(
                    users[randomUser].name
                ));
            } else {
                util.chatter.say(options.output.raffle.noWinner);
            }
        }
    }
}

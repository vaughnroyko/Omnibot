var database = global.database;
var ranks = global.data.ranks;
var util = global.util;

module.exports = {
    /*
      usage: !quote <author> <quote>
    */
    quote: function (user, params) {
        var params = message.split(" ");
        var author = params[1].toLowerCase();
        var quote = params.slice(2).join(" ");
        // Do something
        database.users.findOne({username: user.name, time: { $gt: 100 }}, function(err, docs) {
            //Only allow people with certain time, or me, or mode to add quotes
            if (docs || user.rank >= ranks.Moderator) {
                database.users.findOne({username: author}, function(err, docs) {
                    if (docs) {
                        var now = new Date();
                        //TODO doesn"t work?
                        database.quotes.insert({username: author, quote: quote, added: now});
                        util.say("Quote has been added for " + author + "!");
                    } else {
                        util.say(author + " does not exist!");
                    }
                });
            }
        });
    },
    /*
      usage: !recite <user=[random]>
    */
    recite: function (user, params) {
        var rand = Math.floor(Math.random() * database.quotes.count());
        //TODO fix, map/toArray not working - we shouldn"t need array/map here
        database.quotes.find().limit(-1).skip(rand).next().toArray().map(function(doc) {
            util.say(doc.username + ": " + doc.quote);
        });
    }
}
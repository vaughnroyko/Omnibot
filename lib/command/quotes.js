var database = global.database;
var ranks = global.data.ranks;
var util = global.util;
var viewers = global.util.viewers;
var options = global.options;
var mongoose = global.modules.mongoose;
var sync = global.modules.sync;

database.quotes = mongoose.model(options.twitch.channel + '.quotes', mongoose.Schema({
    quote: String,
    author: String,
    create: Date,
    added: String
}));

module.exports = {
    /*
      usage: !quote <author> <quote>
    */
    quote: function (user, author, quote) {

        // Only viewers can use this
        if (user.rank < ranks.viewer) {
            util.chatter.say(util.weave("quote.rank", 
                user
            ));
            return;
        }

        // Check both params are there
        if (!author || !quote) {
            util.chatter.say(options.output.quote.syntax);
            return;
        }

        // Params
        author = util.viewers.get(author);
        author = author.name.toLowerCase();
        quote = [].slice.call(arguments, 0);
        quote.splice(0, 2);

        // Find the author
        global.database.users.findOne({name: author}, function (err, result) {
            if (result) {
                author = result;

                // Remove any more than one space, remove matching quotes at the beginning and end
                quote = quote.join(' ');
                var ts1 = quote.match(/^["']*/)[0], ts2 = quote.match(/ *["']*$/)[0];
                if (ts1.length > 0 && ts2.length > 0) {
                    var l = 0, ts2lm1 = ts2.length - 1;
                    while (l < ts1.length && ts1[l] == ts2[ts2lm1 - l]) l++;
                    if (l > 0) quote = quote.slice(l, -l);
                }

                quote = quote.replace(/\s\s+/g, ' ').trim();

                util.chatter.say(util.weave("quote.normal", 
                    author,
                    quote
                ));
                var newQuote = new global.database.quotes({
                    quote: quote,
                    author: author.name,
                    create: new Date,
                    added: user.name
                });
                sync.wait(newQuote, 'save', [sync.defer()]);
            } else {
                // Author not found
                util.chatter.say(util.weave("quote.unknown", 
                    author
                ));
            }
        });
    },
    /*
      usage: !recite <author=[random]>
    */
    recite: function (user, author) {

        var query = {};
        // Get a user
        if (author) {
            author = util.viewers.get(author);
            author = author.name.toLowerCase();
            query = {
                author: author
            };
        }
        global.database.quotes.count(query, function (err, count) {
            if (count) {
                var randomQuoteOffset = Math.floor(Math.random() * count);
                global.database.quotes.find(query).limit(-1).skip(randomQuoteOffset).lean().exec(function (err, quote) {
                    var selectedQuote = quote[0];
                    var createdYear = selectedQuote.create.getFullYear();
                    util.chatter.say(util.weave("recite.normal", 
                        selectedQuote,
                        createdYear
                    ));
                });
            } else {
                if (author) {
                    // Author not found
                    util.chatter.say(util.weave("quote.unknown", author));
                } else {
                    // No quotes found in DB
                    util.chatter.say(options.output.recite.noQuotes);
                }
            }
        });

    }
}

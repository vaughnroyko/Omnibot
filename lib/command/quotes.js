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
            util.chatter.say(options.output.quote.rank.weave(
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
        global.database.users.findOne({name: author}, function (err, user) {
            if (user) {
                // Remove any more than one space
                var sanitizedQuote = quote.join(' ').replace(/\s\s+/g, ' ');
                util.chatter.say(options.output.quote.normal.weave(
                    user,
                    sanitizedQuote
                ));
                var newQuote = new global.database.quotes({
                    quote: sanitizedQuote,
                    author: author,
                    create: new Date,
                    added: user.name
                });
                sync.wait(newQuote, 'save', [sync.defer()]);
            } else {
                // Author not found
                util.chatter.say(options.output.quote.unknown.weave(
                    author
                ));
            }
        });
    },
    /*
      usage: !recite <author=[random]>
    */
    recite: function (user, author) {

        var findAuthor = {};
        // Get a user
        if (author) {
            author = util.viewers.get(author);
            author = author.name.toLowerCase();
            findAuthor = {
                author: author
            };
        }
        global.database.quotes.count(findAuthor, function (err, count) {
            if (count) {
                var randomQuoteOffset = Math.floor(Math.random() * count);
                global.database.quotes.find(findAuthor).limit(-1).skip(randomQuoteOffset).exec(function (err, quote) {
                    //var createdYear = quote.create.getFullYear();
                    util.chatter.print(styles.console.info(quote));
                    util.chatter.print(quote.create);
                    //util.chatter.print(styles.console.info(createdYear));
                    //chatter.print(styles.console.info(options.output.recite.normal.weave(
                        //quote,
                        //createdYear
                    //)));
                });
            } else {
                if (author) {
                    // Author not found
                    util.chatter.say(options.output.quote.unknown.weave(author));
                } else {
                    // No quotes found in DB
                    util.chatter.say(options.output.recite.noQuotes);
                }
            }
        });

    }
}

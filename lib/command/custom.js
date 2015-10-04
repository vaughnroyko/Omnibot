
var database = global.database;
var styles = global.styles;
var options = global.options;
var ranks = global.data.ranks;

database.commands = global.modules.mongoose.model(options.twitch.channel + '.commands', global.modules.mongoose.Schema({
    name: String,
    rank: Number,
    output: String
}));

var customCommands = global.customCommands = {
    names: [],
    run: function (name, user, params) {
        database.commands.findOne({name: name}, function (err, command) {
            if (command) {
                util.chatter.say(styles.bot(command.output));
            } else {
                util.chatter.log(null, styles.console.error("Could not find command by name '" + name + "'"));
            }
        });
    },
    load: function (name) {
        if (!(name in global.bot.commands)) {
            this.names.push(name);
            global.bot.commands[name] = function (user, params) {
                customCommands.run(name, user, params);
            };
            //util.chatter.log(null, styles.bot("Command of name '" + name + "' was added"));
        }
    }
};

module.exports = {
    /*
      usage:
        !command add <name> <output..>
        !command edit <name> <output..>
        !command remove <name>
        !command rename <name> <new name>
        !command rank <name> <rank>
    */
    command: function (user, action, name, extra) {
        if (user.rank >= ranks.admin) {
            if (action == "add" || action == "create") {
                if (customCommands.names.indexOf(name) < 0) {
                    var output = [].slice.call(arguments, 0);
                    output.splice(0, 3);
                    var command = new database.commands({
                        name: name,
                        rank: ranks.viewer,
                        output: output.join(' ')
                    });
                    command.save(function(err, result) {
                        if (err) {
                            util.chatter.say("Command '" + name + "' could not be added");
                        } else {
                            global.customCommands.load(name);
                            util.chatter.say("Command '" + name + "' was successfully added");
                        }
                    });
                } else {
                    util.chatter.say("Command '" + name + "' already exists");
                }
            } else if (action == "remove" || action == "delete") {
                var index = customCommands.names.indexOf(name);
                if (index > -1) {
                    database.commands.remove({name: name}, function (err, result) {
                        if (err) {
                            util.chatter.say("Command '" + name + "' could not be removed");
                        } else {
                            global.customCommands.names.splice(index, 1);
                            delete global.bot.commands[name];
                            util.chatter.say("Command '" + name + "' was successfully removed");
                        }
                    });
                } else {
                    util.chatter.say("Command '" + name + "' does not exist");
                }
            } else if (action == "edit") {
                var index = customCommands.names.indexOf(name);
                if (index > -1) {
                    var output = [].slice.call(arguments, 0);
                    output.splice(0, 3);
                    database.commands.update(
                        {name: name},
                        {output: output.join(' ')},
                        function (err, result) {
                            if (err) {
                                util.chatter.say("Command '" + name + "' could not be edited");
                            } else {
                                util.chatter.say("Command '" + name + "' was successfully edited");
                            }
                        }
                    );
                } else {
                    util.chatter.say("Command '" + name + "' does not exist");
                }
            } else if (action == "rename") {
                var index = customCommands.names.indexOf(name);
                if (index > -1) {
                    database.commands.update(
                        {name: name},
                        {name: extra},
                        function (err, result) {
                            if (err) {
                                util.chatter.say("Command '" + name + "' could not be renamed");
                            } else {
                                global.customCommands.names.splice(index, 1);
                                delete global.bot.commands[name];
                                customCommands.load(extra);
                                util.chatter.say("Command '" + name + "' was successfully renamed to '" + extra + "'");
                            }
                        }
                    );
                } else {
                    util.chatter.say("Command '" + name + "' does not exist");
                }
            }
        }
    }
};
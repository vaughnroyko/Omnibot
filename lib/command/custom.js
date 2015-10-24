
var database = global.database;
var styles = global.styles;
var options = global.options;
var ranks = global.data.ranks;

var bot = global.bot;
var modules = global.modules;
var chatter = global.util.chatter;

database.commands = modules.mongoose.model(options.twitch.channel + '.commands', modules.mongoose.Schema({
    name: String,
    rank: Number,
    output: String
}));

var customCommands = global.customCommands = {
    names: [],
    run: function (name, user, params) {
        database.commands.findOne({name: name}, function (err, command) {
            if (command) {
                if (RegExp("^" + options.core.prefixes.basic + "[^ ]+( |$)").test(command.output)) {
                    var end = command.output.indexOf(' ');
                    if (end == -1) end = command.output.length; else end = end + 1;
                    var cmdname = command.output.slice(1, end);
                    if (cmdname in bot.commands) {
                        chatter.run.command(user, command.output, true);
                        return;
                    }
                }
                chatter.say(styles.bot(command.output));
            } else {
                if (options.output.commands.logCommandFails) {
                    chatter.log(null, styles.console.error(options.output.commands.notFound.weave(name, user)));
                }
                // TODO whisper cmd failure
            }
        });
    },
    load: function (name) {
        this.names.push(name);
        global.bot.commands[name] = function (user, params) {
            customCommands.run(name, user, params);
        };
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
                if (customCommands.names.indexOf(name) < 0 && !(name in bot.commands)) {
                    var output = [].slice.call(arguments, 0);
                    output.splice(0, 3);
                    var command = new database.commands({
                        name: name,
                        rank: ranks.viewer,
                        output: output.join(' ')
                    });
                    command.save(function(err, result) {
                        if (err) {
                            chatter.say(options.output.commands.create.fail.weave(name));
                        } else {
                            customCommands.load(name);
                            chatter.say(options.output.commands.create.success.weave(name));
                        }
                    });
                } else {
                    chatter.say(options.output.commands.create.exist.weave(name));
                }
            } else if (action == "remove" || action == "delete") {
                var index = customCommands.names.indexOf(name);
                if (index > -1) {
                    database.commands.remove({name: name}, function (err, result) {
                        if (err) {
                            chatter.say(options.output.commands.remove.fail.weave(name));
                        } else {
                            customCommands.names.splice(index, 1);
                            delete bot.commands[name];
                            chatter.say(options.output.commands.remove.success.weave(name));
                        }
                    });
                } else {
                    chatter.say(options.output.commands.notExist.weave(name));
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
                                chatter.say(options.output.commands.edit.fail.weave(name));
                            } else {
                                chatter.say(options.output.commands.edit.success.weave(name));
                            }
                        }
                    );
                } else {
                    chatter.say(options.output.commands.notExist.weave(name));
                }
            } else if (action == "rename") {
                var index = customCommands.names.indexOf(name);
                if (index > -1) {
                    database.commands.update(
                        {name: name},
                        {name: extra},
                        function (err, result) {
                            if (err) {
                                chatter.say(options.output.commands.rename.fail.weave(name));
                            } else {
                                customCommands.names.splice(index, 1);
                                delete bot.commands[name];
                                customCommands.load(extra);
                                chatter.say(options.output.commands.rename.success.weave(name, extra));
                            }
                        }
                    );
                } else {
                    chatter.say(options.output.commands.notExist.weave(name));
                }
            }
        }
    }
};
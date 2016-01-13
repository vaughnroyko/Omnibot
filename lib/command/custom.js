
var database = global.database;
var styles = global.styles;
var options = global.options;
var ranks = global.data.ranks;

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
        name = name.toLowerCase();
        database.commands.findOne({name: name}, function (err, command) {
            if (command) {
                if (RegExp("^" + options.core.prefixes.basic + "[^ ]+( |$)").test(command.output)) {
                    var end = command.output.indexOf(' ');
                    if (end == -1) end = command.output.length; else end = end + 1;
                    var cmdname = command.output.slice(1, end);
                    if (cmdname in global.bot.commands) {
                        chatter.run.command(user, command.output, true);
                        return;
                    }
                }
                chatter.say(styles.bot(command.output));
            } else {
                if (options.output.commands.logCommandFails) {
                    chatter.print(styles.console.error(util.weave("commands.notFound", name, user)));
                }
                // TODO whisper failure of the command to the executing user
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
        name = name.toLowerCase();
        if (user.rank >= ranks.admin) {
            if (action == "add" || action == "create") {
                if (customCommands.names.indexOf(name) < 0 && !(name in global.bot.commands)) {
                    var output = [].slice.call(arguments, 0);
                    output.splice(0, 3);
                    var command = new database.commands({
                        name: name,
                        rank: ranks.viewer,
                        output: output.join(' ')
                    });
                    command.save(function(err, result) {
                        if (err) {
                            chatter.say(util.weave("commands.create.fail", name));
                        } else {
                            customCommands.load(name);
                            chatter.say(util.weave("commands.create.success", name));
                        }
                    });
                } else {
                    chatter.say(util.weave("commands.create.exist", name));
                }
            } else if (action == "remove" || action == "delete") {
                var index = customCommands.names.indexOf(name);
                if (index > -1) {
                    database.commands.remove({name: name}, function (err, result) {
                        if (err) {
                            chatter.say(util.weave("commands.remove.fail", name));
                        } else {
                            customCommands.names.splice(index, 1);
                            delete global.bot.commands[name];
                            chatter.say(util.weave("commands.remove.success", name));
                        }
                    });
                } else {
                    chatter.say(util.weave("commands.notExist", name));
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
                                chatter.say(util.weave("commands.edit.fail", name));
                            } else {
                                chatter.say(util.weave("commands.edit.success", name));
                            }
                        }
                    );
                } else {
                    chatter.say(util.weave("commands.notExist", name));
                }
            } else if (action == "rename") {
                var index = customCommands.names.indexOf(name);
                if (index > -1) {
                    database.commands.update(
                        {name: name},
                        {name: extra},
                        function (err, result) {
                            if (err) {
                                chatter.say(util.weave("commands.rename.fail", name));
                            } else {
                                customCommands.names.splice(index, 1);
                                delete global.bot.commands[name];
                                customCommands.load(extra);
                                chatter.say(util.weave("commands.rename.success", name, extra));
                            }
                        }
                    );
                } else {
                    chatter.say(util.weave("commands.notExist", name));
                }
            }
        }
    }
};
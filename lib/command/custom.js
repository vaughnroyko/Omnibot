
var database = global.database;
var styles = global.styles;
var options = global.options;
var ranks = global.data.ranks;

var customCommands = global.customCommands = {
    names: [],
    run: function (name, user, params) {
        database.commands.findOne({name: name}, function (err, command) {
            if (command) {
                util.say(styles.bot(command.output));
            } else {
                util.log(null, styles.console.error("Could not find command by name '" + name + "'"));
            }
        });
    },
    load: function (name) {
        if (!(name in global.bot.commands)) {
            this.names.push(name);
            global.bot.commands[name] = function (user, params) {
                customCommands.run(name, user, params);
            };
            util.log(null, styles.bot("Command of name '" + name + "' was added"));
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
    command: function (user, params) {
        if (user.rank >= ranks.Broadcaster || (options.core.modsCanRunBroadcasterCommands && user.rank == ranks.Moderator)) {
            if (params[0] == "add" || params[0] == "create") {
                if (customCommands.names.indexOf(params[1]) < 0) {
                    var command = new database.commands({
                        name: params[1],
                        rank: ranks.Viewer,
                        output: params.slice(2).join(' ')
                    });
                    command.save(function(err, result) {
                        if (err) {
                            util.say("Command '" + params[1] + "' could not be added");
                        } else {
                            global.customCommands.load(params[1]);
                            util.say("Command '" + params[1] + "' was successfully added");
                        }
                    });
                } else {
                    util.say("Command '" + params[1] + "' already exists");
                }
            } else if (params[0] == "remove" || params[0] == "delete") {
                var index = customCommands.names.indexOf(params[1]);
                if (index > -1) {
                    database.commands.remove({name: params[1]}, function (err, result) {
                        if (err) {
                            util.say("Command '" + params[1] + "' could not be removed");
                        } else {
                            global.customCommands.names.splice(index, 1);
                            delete global.bot.commands[params[1]];
                            util.say("Command '" + params[1] + "' was successfully removed");
                        }
                    });
                } else {
                    util.say("Command '" + params[1] + "' does not exist");
                }
            } else if (params[0] == "edit") {
                var index = customCommands.names.indexOf(params[1]);
                if (index > -1) {
                    database.commands.update(
                        {name: params[1]},
                        {output: params.slice(2).join(' ')},
                        function (err, result) {
                            if (err) {
                                util.say("Command '" + params[1] + "' could not be edited");
                            } else {
                                util.say("Command '" + params[1] + "' was successfully edited");
                            }
                        }
                    );
                } else {
                    util.say("Command '" + params[1] + "' does not exist");
                }
            } else if (params[0] == "rename") {
                var index = customCommands.names.indexOf(params[1]);
                if (index > -1) {
                    database.commands.update(
                        {name: params[1]},
                        {name: params[2]},
                        function (err, result) {
                            if (err) {
                                util.say("Command '" + params[1] + "' could not be renamed");
                            } else {
                                global.customCommands.names.splice(index, 1);
                                delete global.bot.commands[params[1]];
                                customCommands.load(params[2]);
                                util.say("Command '" + params[1] + "' was successfully renamed to '" + params[2] + "'");
                            }
                        }
                    );
                } else {
                    util.say("Command '" + params[1] + "' does not exist");
                }
            }
        }
    }
};

var database = global.database;
var styles = global.styles;
var options = global.options;

var customCommands = global.customCommands = {
    names: [],
    run: function (name, user, params) {
        database.commands.findOne({name: name}, function (err, command) {
            if (command) {
                util.say(styles.bot(command.output));
            } else {
                console.log(styles.console.error("Could not find command by name " + name));
            }
        });
    },
    load: function (name) {
        if (!(name in global.bot.commands)) {
            this.names.push(name);
            global.bot.commands[name] = function (user, params) {
                customCommands.run(name, user, params);
            };
            console.log(styles.bot("Command of name " + name + " was added"));
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
            if (params[0] == "add") {
                var command = new database.commands({
                    name: params[1],
                    output: params.slice(2).join(' ')
                });
                command.save(function(err, result) {
                    if (err) {
                        console.log(styles.console.error("something went wrong!"));
                    } else {
                        global.customCommands.load(params[1]);
                    }
                });
            } else if (params[0] == "remove" || params[0] == "delete") {
                var index = customCommands.names.indexOf(params[1]);
                if (index > -1) {
                    database.commands.remove({name: params[1]}, function (err, result) {
                        if (!err) {
                            global.customCommands.names.splice(index, 1);
                            delete global.bot.commands[params[1]];
                            util.say("Command '"+ params[1] +"' successfully removed!");
                        }
                    });
                }
            } else if (params[0] == "edit") {

            }
        }
    }
};
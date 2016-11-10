import {
    Plugin, API, Ranks,
    CommandLibrary, Command,
    Chatter,
    Collection, Document
} from "../../api";

export class CustomCommand extends Document {
    public name: string;
    public rank: number;
    public content: string;
    public stat_callsToDate: number;
    public stat_lastCall: Date;
    public stat_failsToDate: number;

    private command: Command;
    static getCommand (customCommand: CustomCommand): Command {
        if (!customCommand.command) customCommand.command = {
            rank: { min: customCommand.rank },
            call: (api: API) => {
                api.chat.say(customCommand.content);
                customCommand.stat_lastCall = new Date;
                customCommand.stat_callsToDate++;
                customCommand.save();
            }
        }
        return customCommand.command;
    }
}

export class CustomCommands extends Plugin {
    constructor () { super("custom-commands"); }

    collection: Collection<CustomCommand>;
    loadedCommands: { [key: string]: CustomCommand } = {};

    onInit (api: API) {
        this.collection = api.database.collection<CustomCommand>("customCommands", {
            name: { type: String, unique: true },
            content: String,
            rank: { type: Number, default: Ranks["new"] },
            stat_callsToDate: { type: Number, default: 0 },
            stat_lastCall: { type: Date, default: undefined },
            stat_failsToDate: { type: Number, default: 0 }
        });
    }
    onUnknownCommand (api: API, name: string): Command | CommandLibrary {
        let customCommand = name in this.loadedCommands ? 
            this.loadedCommands[name] : this.collection.where({ name: name }).findOne();
        if (!customCommand) return;
        this.loadedCommands[name] = customCommand;
        return CustomCommand.getCommand(customCommand);
    }
    
    commands = <CommandLibrary> {
        command: <CommandLibrary> {
            add: {
                args: [
                    { name: "commandName", type: "string" },
                    { name: "commandContent", type: "...string" }
                ],
                rank: { min: Ranks.mod },
                call: (api: API, caller: Chatter, name: string, content: string[]) => {
                    // add a new command
                    try {
                        this.collection.insert({
                            name: name,
                            content: content.join(" ")
                        });
                        api.reply(caller, "Successfully added command '" + name + "'");
                    } catch (err) {
                        if (err.name == "UniquePropertyError") {
                            api.reply(caller, "There is already a command with the name '" + name + "'");
                        } else throw err;
                    }
                }
            },
            edit: {
                args: [
                    { name: "commandName", type: "string" },
                    { name: "commandContent", type: "...string" }
                ],
                rank: { min: Ranks.mod },
                call: (api: API, caller: Chatter, name: string, content: string[]) => {
                    // edit the message of a command
                    let command = this.collection.where({ name: name }).findOne();
                    if (!command) return api.reply(caller, "There is no command by the name '" + name + "'");
                    command.content = content.join(" ");
                    command.save();
                    api.reply(caller, "Successfully edited command '" + name + "'");
                }
            },
            remove: {
                args: [
                    { name: "commandName", type: "string" }
                ],
                rank: { min: Ranks.mod },
                call: (api: API, caller: Chatter, name: string) => {
                    // remove a command
                    let command = this.collection.where({ name: name }).findOne();
                    if (!command) return api.reply(caller, "There is no command by the name '" + name + "'");

                    command.delete();
                    api.reply(caller, "Successfully removed the command '" + name + "'");
                }
            },
            rename: {
                args: [
                    { name: "oldName", type: "string" },
                    { name: "newName", type: "string" }
                ],
                rank: { min: Ranks.mod },
                call: (api: API, caller: Chatter, oldName: string, newName: string) => {
                    // rename a command
                    let command = this.collection.where({ name: oldName }).findOne();
                    if (!command) return api.reply(caller, "There is no command by the name '" + name + "'");

                    command.name = newName;
                    try {
                        command.save();
                        api.reply(caller, "Successfully renamed the command '" + oldName + "' to '" + newName + "'");
                    } catch (err) {
                        if (err.name == "UniquePropertyError") {
                            api.reply(caller, "There is already a command with the name '" + newName + "'");
                        } else throw err;
                    }
                }
            },
            rank: {
                args: [
                    { name: "commandName", type: "string" },
                    { name: "callerRank", type: "string" }
                ],
                rank: { min: Ranks.mod },
                call: (api: API, caller: Chatter, name: string, rank: string) => {
                    // change the rank of a custom command
                    let command = this.collection.where({ name: name }).findOne();
                    if (!command) return api.reply(caller, "There is no command by the name '" + name + "'");

                    command.rank = Ranks.get(rank);
                    command.save();
                    api.reply(caller, "Successfully changed the rank required to run '" + name + "' to '" + Ranks[command.rank] + "'");
                }
            }
        }
    }
}
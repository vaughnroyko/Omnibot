import {
    Plugin, API, Ranks,
    CommandLibrary, Command,
    Chatter,
    Collection, Document
} from "../../api";

class CustomCommand extends Document {
    public name: string;
    public rank: number;
    public content: string;
    public stat_callCount: number;
    public stat_lastCall: Date;

    private command: Command;
    static getCommand (customCommand: CustomCommand): Command {
        if (!customCommand.command) customCommand.command = {
            rank: { min: customCommand.rank },
            call: (api: API) => {
                api.say(customCommand.content);
                customCommand.stat_lastCall = new Date;
                customCommand.stat_callCount++;
                customCommand.save();
            }
        }
        return customCommand.command;
    }
}

class CustomCommands extends Plugin {
    constructor () { super("custom-commands"); }

    collection: Collection<CustomCommand>;
    loadedCommands: { [key: string]: CustomCommand } = {};

    onInit (api: API) {
        this.collection = api.database.collection<CustomCommand>("customCommands", {
            name: { type: String, unique: true },
            content: String,
            rank: { type: Number, default: Ranks["new"] },
            stat_callCount: { type: Number, default: 0 },
            stat_lastCall: { type: Date, default: undefined }
        });
    }
    onUnknownCommand (api: API, name: string): Command | CommandLibrary {
        var customCommand = name in this.loadedCommands ? 
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
                        api.chat.whisper(caller, "Successfully added command '" + name + "'");
                    } catch (err) {
                        if (err.name == "UniquePropertyError") {
                            api.chat.whisper(caller, "There is already a command with the name '" + name + "'");
                        }
                    }
                }
            },
            edit: {
                args: [
                    { name: "commandName", type: "string" },
                    { name: "commandContent", type: "...string" }
                ],
                rank: { min: Ranks.mod },
                call: (api: API, caller: Chatter, name: string, content: string) => {
                    // edit the message of a command
                    console.log("Editing the command '" + name + "' to the content '" + content + "'");
                }
            },
            remove: {
                args: [
                    { name: "commandName", type: "string" }
                ],
                rank: { min: Ranks.mod },
                call: (api: API, caller: Chatter, name: string) => {
                    // remove a command
                    console.log("Removing the command '" + name + "'");
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
                    console.log("Renaming the command '" + name + "' to '" + newName + "'");
                }
            },
            rank: {
                args: [
                    { name: "commandName", type: "string" },
                    { name: "callerRank", type: "string|number" }
                ],
                rank: { min: Ranks.mod },
                call: (api: API, caller: Chatter, name: string, rank: string) => {
                    // change the rank of a custom command
                    console.log("Changing the minimum rank to run the command '" + name + "' to '" + rank + "'");
                }
            }
        }
    }
}

export = new CustomCommands as Plugin;
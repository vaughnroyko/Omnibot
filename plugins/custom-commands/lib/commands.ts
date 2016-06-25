import { Plugin, CommandLibrary, CommandAPI, Document, Ranks } from "../../api";

class CustomCommand extends Document {
    public name: string;
    public rank: number;
    public stat_callCount: number;
    public stat_lastCall: Date;
}

var CustomCommands = new Plugin("custom-commands");

CustomCommands.commands = <CommandLibrary> {
    command: <CommandLibrary> {
        add: {
            args: [
                { name: "commandName", type: "string" },
                { name: "commandContent", type: "...string" }
            ],
            rank: { min: Ranks.mod },
            call: function (api: CommandAPI, name: string, content: string[]) {
                // add a new command
                console.log("Adding command with name '" + name + "' and content '" + content + "'");
                api.database.collection<CustomCommand>("customCommands", {
                    name: { type: String, unique: true },
                    rank: { type: Number, default: Ranks.new },
                    stat_callCount: { type: Number, default: 0 },
                    stat_lastCall: { type: Date, default: undefined }
                });
            }
        },
        edit: {
            args: [
                { name: "commandName", type: "string" },
                { name: "commandContent", type: "...string" }
            ],
            rank: { min: Ranks.mod },
            call: function (api: CommandAPI, name: string, content: string) {
                // edit the message of a command
                console.log("Editing the command '" + name + "' to the content '" + content + "'");
            }
        },
        remove: {
            args: [
                { name: "commandName", type: "string" }
            ],
            rank: { min: Ranks.mod },
            call: function (api: CommandAPI, name: string) {
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
            call: function (api: CommandAPI, oldName: string, newName: string) {
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
            call: function (api: CommandAPI, name: string, rank: string) {
                // change the rank of a custom command
                console.log("Changing the minimum rank to run the command '" + name + "' to '" + rank + "'");
            }
        }
    }
};

export = CustomCommands;
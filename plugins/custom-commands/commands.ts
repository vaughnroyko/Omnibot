/// <reference path="../api.d.ts" />
/// <reference path="../../out/core/Chatters.d.ts" />

export = <CommandLibrary> {
    command: <CommandLibrary> {
        add: {
            args: [
                { name: "commandName", type: "number" },
                { name: "commandContent", type: "...string" }
            ],
            rank: { min: "mod" },
            call: function (bot: CommandAPI, name: string, content: string[]) {
                // add a new command
                console.log("Adding command with name '" + name + "' and content '" + content + "'");
            }
        },
        edit: {
            args: [
                { name: "commandName", type: "string" },
                { name: "commandContent", type: "...string" }
            ],
            rank: { min: "mod" },
            call: function (bot: CommandAPI, name: string, content: string) {
                // edit the message of a command
                console.log("Editing the command '" + name + "' to the content '" + content + "'");
            }
        },
        remove: {
            args: [
                { name: "commandName", type: "string" }
            ],
            rank: { min: "mod" },
            call: function (bot: CommandAPI, name: string) {
                // remove a command
                console.log("Removing the command '" + name + "'");
            }
        },
        rename: {
            args: [
                { name: "oldName", type: "string" },
                { name: "newName", type: "string" }
            ],
            rank: { min: "mod" },
            call: function (bot: CommandAPI, oldName: string, newName: string) {
                // rename a command
                console.log("Renaming the command '" + name + "' to '" + newName + "'");
            }
        },
        rank: {
            args: [
                { name: "commandName", type: "string" },
                { name: "callerRank", type: "string|number" }
            ],
            rank: { min: "mod" },
            call: function (bot: CommandAPI, name: string, rank: string) {
                // change the rank of a custom command
                console.log("Changing the minimum rank to run the command '" + name + "' to '" + rank + "'");
            }
        }
    }
};
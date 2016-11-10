let season = require("season");
import path = require("path");
import { Database } from "typego";

import fs = require("../util/fs");

import { Library, Command } from "./Commands";
import { Chat, Chatter } from "./Chat";

import { PluginAPI } from "./PluginAPI";

import weaving = require("weaving");

weaving.library.add(function (library) {
    return {
        name: "weaving-chalk",
        match: ["@", library.KEYS, ":", library.KEYS],
        return: (_o: string, fn: weaving.Matchables.Matched.KEYS, _c: string, using: weaving.Matchables.Matched.KEYS) => {
            
        }
    };
});

interface PluginData {
    name?: string;
    main: string;
    dependencies?: string[];
    exportName?: string;
}

class PluginError extends weaving.Error {
    weavingMessage = "Could not load the plugin '{0}'{1?~: {1}}";
}
class InvalidPluginDefinitionFileError extends weaving.Error {
    weavingMessage = "Invalid plugin definition file."
}

export class InternalPlugin {
    name: string;
    directory: string;
    commandLibrary: Library = {};
    plugin: Plugin;
    constructor (directory: string, private api: PluginAPI) {
        this.directory = directory;
        let data: PluginData;
        try {
            data = season.readFileSync(path.join(directory, "plugin.cson"));
        } catch (err) {
            throw new InvalidPluginDefinitionFileError();
        }
        this.name = data.name || path.basename(directory);
        let imported: any;
        try {
            imported = require(path.join(directory, data.main));
        } catch (err) {
            throw new PluginError(this.name, err.message);
        }
        if (imported instanceof Plugin) {
            // it's already a plugin, so do nothing
        } else if (imported.prototype instanceof Plugin) {
            // it's a plugin class, but it still needs to be instanciated
            this.plugin = new imported;
        } else if (
            "exportName" in data && 
            data.exportName in imported
        ) {
            // using a custom export name (for plugins that export multiple things)
            if (imported[data.exportName] instanceof Plugin) {
                this.plugin = imported[data.exportName];
            } else if (imported[data.exportName].prototype instanceof Plugin) {
                this.plugin = new imported[data.exportName];
            } else throw new PluginError(this.name);
        } else throw new PluginError(this.name);

        if (this.plugin.commands)
            this.commandLibrary = this.plugin.commands;

        // api call
        this.plugin.onInit(this.api);
    }

    // events
    onUnknownCommand (commandName: string): Command | Library {
        return this.plugin.onUnknownCommand(this.api, commandName);
    }
    onChatterJoin (chatter: Chatter, isNew: boolean) {
        this.plugin.onChatterJoin(this.api, chatter, isNew);
    }
}

export abstract class Plugin {
    commands: Library = {};
    constructor(public name: string) {}

    onInit (api: PluginAPI): void {}
    //// TODO more api support
    //onClosing (): void {}
    onUnknownCommand (api: PluginAPI, commandName: string): Command | Library { return; }
    onChatterJoin (api: PluginAPI, chatter: Chatter, isNew: boolean): void {}
    //onCommandFailed (): void {}
    //onChat (user: Chatter, message: string, whisper = false): void {}
}

export module Plugins {
    export function load (directory: string, api: PluginAPI) {
        directory = path.resolve(directory);
        let dirContents = fs.readdirSync(directory);
        let result: InternalPlugin[] = [];
        for (let pluginDir of dirContents) {
            try {
                let plugin = new InternalPlugin(path.join(directory, pluginDir), api);
                if (plugin) result.push(plugin);
            } catch (err) {
                if (err instanceof PluginError) {
                    console.log(err.message);
                } else if (err instanceof InvalidPluginDefinitionFileError) {
                    // we ignore invalid plugin definition file errors
                } else throw err;
            }
        }
        return result;
    }
}
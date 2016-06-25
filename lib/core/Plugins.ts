var season = require("season");
import path = require("path");
import fs = require("../util/fs");

import { Library, Command } from "./Commands";
import { Chatters, Chatter } from "./Chatters";

interface PluginData {
    name?: string;
    main: string;
    dependencies?: string[];
}

export class InternalPlugin {
    name: string;
    directory: string;
    commandLibrary: Library = {};
    plugin: Plugin;
    constructor (directory: string) {
        this.directory = directory;
        var data: PluginData = season.readFileSync(path.join(directory, "plugin.cson"));
        this.name = data.name || path.basename(directory);
        this.plugin = require(path.join(directory, data.main));
        if (this.plugin.commands)
            this.commandLibrary = this.plugin.commands;

        // api call
        this.plugin.onInit();
    }
}

export class Plugin {
    commands: Library = {};
    constructor(public name: string) {}

    onInit (): void {}
    //// TODO more api support
    //onClosing (): void {}
    //onCommandCalled (commandName: string): Command | Library { return; }
    //onCommandFailed (): void {}
    //onChat (user: Chatter, message: string, whisper = false): void {}
}

export module Plugins {
    export function load (directory: string) {
        directory = path.resolve(directory);
        var dirContents = fs.readdirSync(directory);
        var result: InternalPlugin[] = [];
        for (var pluginDir of dirContents) {
            try {
                var plugin = new InternalPlugin(path.join(directory, pluginDir));

                result.push(plugin);
            } catch (err) {
                if (!("code" in err && err.code == "ENOENT")) console.log(err.stack);
            }
        }
        return result;
    }
}
var season = require("season");
import path = require("path");
import { Database } from "typego";

import fs = require("../util/fs");

import { Library, Command } from "./Commands";
import { Chat, Chatter } from "./Chat";

import { PluginAPI } from "./PluginAPI";

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
    constructor (directory: string, private api: PluginAPI) {
        this.directory = directory;
        var data: PluginData = season.readFileSync(path.join(directory, "plugin.cson"));
        this.name = data.name || path.basename(directory);
        this.plugin = require(path.join(directory, data.main));
        if (this.plugin.commands)
            this.commandLibrary = this.plugin.commands;

        // api call
        this.plugin.onInit(this.api);
    }
    onUnknownCommand (commandName: string): Command | Library {
        return this.plugin.onUnknownCommand(this.api, commandName);
    }
}

export class Plugin {
    commands: Library = {};
    constructor(public name: string) {}

    onInit (api: PluginAPI): void {}
    //// TODO more api support
    //onClosing (): void {}
    onUnknownCommand (api: PluginAPI, commandName: string): Command | Library { return; }
    //onCommandFailed (): void {}
    //onChat (user: Chatter, message: string, whisper = false): void {}
}

export module Plugins {
    export function load (directory: string, api: PluginAPI) {
        directory = path.resolve(directory);
        var dirContents = fs.readdirSync(directory);
        var result: InternalPlugin[] = [];
        for (var pluginDir of dirContents) {
            try {
                var plugin = new InternalPlugin(path.join(directory, pluginDir), api);

                result.push(plugin);
            } catch (err) {
                if (!("code" in err && err.code == "ENOENT")) console.log(err.stack);
            }
        }
        return result;
    }
}
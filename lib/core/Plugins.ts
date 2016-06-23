var season = require("season");
import path = require("path");
import fs = require("../util/fs");

import { Library } from "./Commands";

interface PluginData {
    commandLibraries?: string[];
    pluginName?: string;
    dependencies?: string[];
}

export class Plugin {
    name: string;
    directory: string;
    commandLibrary: Library = {};
    constructor (directory: string) {
        this.directory = directory;
        var data: PluginData = season.readFileSync(path.join(directory, "plugin.cson"));
        this.name = data.pluginName || path.basename(directory);
        if (data.commandLibraries) {
            for (var libraryPath of data.commandLibraries) {
                Library.merge(this.commandLibrary, require(path.join(directory, libraryPath)));
            }
        }
    }
}

export module Plugins {
    export function load (directory: string) {
        directory = path.resolve(directory);
        var dirContents = fs.readdirSync(directory);
        var result: Plugin[] = [];
        for (var pluginDir of dirContents) {
            try {
                var plugin = new Plugin(path.join(directory, pluginDir));

                result.push(plugin);
            } catch (err) {
                if (!("code" in err && err.code == "ENOENT")) console.log(err.stack);
            }
        }
        return result;
    }
}
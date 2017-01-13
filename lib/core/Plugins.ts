let season = require("season");
import path = require("path");
import { Database } from "typego";

import fs = require("../util/fs");

import { Library, Command, Commands } from "./Commands";
import { Chat, Chatter } from "./Chat";

import { PluginAPI } from "./interfaces/PluginAPI";
import { Channel } from "./Channel";
import { Options } from "./interfaces/Options";

import weaving = require("weaving");

weaving.library.add(function (library) {
    return {
        name: "weaving-chalk",
        match: ["@", library.KEYS, ":", library.KEYS],
        return: (_o: string, fn: weaving.Matchables.Matched.KEYS, _c: string, using: weaving.Matchables.Matched.KEYS) => {
            console.log(fn);
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
    weavingMessage = "Invalid or no plugin definition file."
}

export class PluginWrapper {
    name: string;
    directory: string;
    commandLibrary: Library = {};
    plugin: Plugin;
    constructor (plugin: Plugin, api: PluginAPI);
    constructor (directory: string, api: PluginAPI);
    constructor (directoryOrPlugin: string | Plugin, private api: PluginAPI) {
        if (typeof directoryOrPlugin == "string") {
            let directory = this.directory = directoryOrPlugin;

            let data: PluginData;
            try {
                data = season.readFileSync(path.join(directory, "plugin.cson"));
            } catch (err) {
                throw new InvalidPluginDefinitionFileError();
            }
            this.name = data.name || path.basename(directory);
            if (this.name[0] == "_") throw new PluginError(this.name, "Plugin names cannot begin with an underscore");

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
                this.plugin = new imported(api);
            } else if (
                "exportName" in data && 
                data.exportName in imported
            ) {
                // using a custom export name (for plugins that export multiple things)
                if (imported[data.exportName] instanceof Plugin) {
                    this.plugin = imported[data.exportName];
                } else if (imported[data.exportName].prototype instanceof Plugin) {
                    this.plugin = new (imported[data.exportName])(api);
                } else throw new PluginError(this.name);
            } else throw new PluginError(this.name);
        } else {
            this.plugin = directoryOrPlugin;
            this.name = this.plugin.name;
        }

        if (this.plugin.commands)
            this.commandLibrary = this.plugin.commands;

        // api call
        this.plugin.onInit();
    }
}

export abstract class Plugin {
    commands: Library = {};
    name: string;
    protected api: PluginAPI;
    constructor (name: string | PluginAPI, api?: PluginAPI) {
        if (typeof name == "string") this.name = name, this.api = api;
        else this.api = name;
    }

    //// TODO more api support
    onInit (): void {}
    //onClosing (): void {}
    onUnknownCommand (commandName: string): Command | Library { return; }
    onChatterJoin (chatter: Chatter, isNew: boolean): void {}
    onChatterPart (chatter: Chatter, isNew: boolean): void {}
    onUpdate (): void {}
    //onCommandFailed (): void {}
    //onChat (user: Chatter, message: string, whisper = false): void {}
}

export class PluginManager {
    api: PluginAPI;
    plugins: PluginWrapper[] = [];
    constructor (directory: string, chat: Chat, commands: Commands, database: Database, channel: Channel, options: Options) {
        
        // the api used by plugins
        this.api = {
            say: chat.say.bind(chat),
            whisper: chat.whisper.bind(chat),
            reply: chat.reply.bind(chat),
            chat, database,
            channel, options
        };
        Object.defineProperty(this.api, "isLive", () => channel.live);

        // send events to plugins
        commands.onUnknownCommand = this.onUnknownCommand.bind(this);
        chat.onChatterJoin = this.onChatterJoin.bind(this);
        chat.onChatterPart = this.onChatterPart.bind(this);

        directory = path.resolve(directory);
        let dirContents = fs.readdirSync(directory);
        for (let i = 0; i < dirContents.length; i++) {
            dirContents[i] = path.join(directory, dirContents[i]);
        }
        this.add(...dirContents);
    }
    add (...plugins: Plugin[]): void;
    add (...pluginPaths: string[]): void;
    add (...plugins: (Plugin | string)[]) {
        for (let pluginOrDirectory of plugins) {
            try {
                let plugin = new PluginWrapper(pluginOrDirectory as any, this.api);
                if (plugin) this.plugins.push(plugin);
            } catch (err) {
                if (err instanceof PluginError) {
                    console.log(err.message);
                } else if (err instanceof InvalidPluginDefinitionFileError) {
                    // we ignore invalid plugin definition file errors--either not valid cson or it's not actually a plugin
                } else throw err;
            }
        }
    }
    forEach (callback: (plugin: PluginWrapper) => any) {
        for (let plugin of this.plugins) callback(plugin);
    }

    // events
    onInit () {
        for (let wrapper of this.plugins) if (wrapper.plugin.onInit) {
            wrapper.plugin.onInit();
        }
    }
    onUnknownCommand (commandName: string): Command | Library {
        for (let wrapper of this.plugins) {
            if (wrapper.plugin.onUnknownCommand) {
                let result = wrapper.plugin.onUnknownCommand(commandName);
                if (result) return result
            }
        }
    }
    onChatterJoin (chatter: Chatter, isNew: boolean) {
        for (let wrapper of this.plugins) if (wrapper.plugin.onChatterJoin) {
            wrapper.plugin.onChatterJoin(chatter, isNew);
        }
    }
    onChatterPart (chatter: Chatter, isNew: boolean) {
        for (let wrapper of this.plugins) if (wrapper.plugin.onChatterPart) {
            wrapper.plugin.onChatterPart(chatter, isNew);
        }
    }
    onUpdate () {
        for (let wrapper of this.plugins) if (wrapper.plugin.onUpdate) {
            wrapper.plugin.onUpdate();
        }
    }
}
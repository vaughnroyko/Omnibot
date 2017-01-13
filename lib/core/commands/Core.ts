import { PluginAPI } from "../interfaces/PluginAPI";
import Ranks = require("../interfaces/Ranks");
import { Options, OutputOptions } from "../interfaces/Options";

import { Library, Command } from "../Commands";
import { Chatter } from "../Chat";
import { Plugin } from "../Plugins";

export class Core extends Plugin {
    constructor (api: PluginAPI) {
        super("_core", api);
    }

    output = this.api.options.output;
    commands = {
        noah: {
            call: () => {
                this.api.say("wow");
            }
        },
        status: {
            call: (caller: Chatter) => {
                this.api.chat.reply(caller, this.output.commands.status.weave({channel: this.api.channel}));
            }
        },
        uptime: {
            call: (caller: Chatter) => {
                let channel = this.api.channel,
                    output = this.output.commands.uptime;
                if (channel.live) {
                    let uptime = this.api.channel.stream.uptime,
                        seconds = Math.floor(uptime / (1000) % 60),
                        minutes = Math.floor(uptime / (1000*60) % 60),
                        hours = Math.floor(uptime / (1000*60*60) % 24),
                        days = Math.floor(uptime / (1000*60*60*24) % 365),
                        years = Math.floor(uptime / (1000*60*60*24*365.25));
                    // because streams really are live for this long. this is completely necessary. shut up.
                    this.api.chat.reply(caller, output.isLive.weave({channel, seconds, minutes, hours, days, years}));
                } else {
                    this.api.chat.reply(caller, output.notLive.weave({channel}));
                }
            }
        },
        time: {
            args: [
                { 
                    name: "chatter",
                    type: "string?"
                }
            ],
            call: (caller: Chatter, requestedUser: string) => {
                let chatter: Chatter;
                if (requestedUser) {
                    chatter = this.api.chat.findChatter(requestedUser);
                    if (!chatter) return this.api.chat.reply(caller, "Are you sure '" + requestedUser + "' has been here before?");
                } else chatter = caller;

                this.api.chat.reply(caller, 
                    (requestedUser ? requestedUser + " has " : "You have ") + chatter.stat_time + " minutes logged."
                );
            }
        }
    };
}
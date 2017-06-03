import { PluginAPI } from "../interfaces/PluginAPI";
import Ranks from "../interfaces/Ranks";
import { Options, OutputOptions } from "../interfaces/Options";

import { Library, Command } from "../Commands";
import { Chatter } from "../Chat";
import { Plugin } from "../Plugins";

export class Core extends Plugin {
	constructor(api: PluginAPI) {
		super("_core", api);
	}

	output = this.api.options.output;
	commands = {
		noah: {
			call: () => {
				this.api.say("wow");
			},
		},
		status: {
			call: (caller: Chatter) => {
				this.api.chat.reply(caller, this.output.commands.status.weave({ channel: this.api.channel }));
			},
		},
		uptime: {
			call: (caller: Chatter) => {
				const channel = this.api.channel,
					output = this.output.commands.uptime;
				if (channel.live) {
					const uptime = this.api.channel.stream.uptime,
						seconds = Math.floor(uptime / (1000) % 60),
						minutes = Math.floor(uptime / (1000 * 60) % 60),
						hours = Math.floor(uptime / (1000 * 60 * 60) % 24),
						days = Math.floor(uptime / (1000 * 60 * 60 * 24) % 365),
						// because streams really are live for this long. this is completely necessary. shut up.
						years = Math.floor(uptime / (1000 * 60 * 60 * 24 * 365.25));
					this.api.chat.reply(caller, output.isLive.weave({ channel, seconds, minutes, hours, days, years }));
				} else {
					this.api.chat.reply(caller, output.notLive.weave({ channel }));
				}
			},
		},
		time: {
			args: [
				{
					name: "chatter",
					type: "string?",
				},
			],
			call: (caller: Chatter, requestedUser: string) => {
				const output = this.output.commands.time;
				let chatter: Chatter;

				if (requestedUser) {
					chatter = this.api.chat.findChatter(requestedUser);
					if (!chatter) this.api.chat.reply(caller, output.unknown.weave({ caller, chatter }));
				} else chatter = caller;

				if (this.api.chat.isBlackListed(chatter)) {
					this.api.chat.reply(caller, output.blacklisted.weave({ caller, chatter }));
				} else {
					this.api.chat.reply(caller, output.normal.weave({ caller, chatter }));
				}
			},
		},
	};
}
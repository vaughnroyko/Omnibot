const twitch = require("tmi.js");
const sync = require("synchronicity");

const events = [
	"action", "chat", "clearchat", "whisper",
	"connected", "disconnected", "reconnect",
	"emoteonly", "emotesets",
	"hosted", "hosting",
	"join", "part",
	"logon", "mod", "mods",
	"notice", "ping", "pong", "r9kbeta",
	"roomstate", "slowmode",
	"subanniversary", "subscribers", "subscription",
	"timeout", "unhost", "unmod",
];

export interface ClientOptions {
	channel: string;
	identity: {
		username: string;
		password: string;
	};
}

export class Client {
	private twitch: any;
	private channel: string;
	private username: string;

	events: { [key: string]: Function[] | Function } = {};

	on (event: string, callback: Function) {
		event = event.toLowerCase();
		if (events.indexOf(event) > -1) {
			if (!Array.isArray(this.events[event]))
				this.events[event] = typeof this.events[event] == "function" ? [this.events[event] as Function] : [];
			const index = this.events[event].length;
			(this.events[event] as Function[]).push(callback);
			(callback as any).cancel = (): any => (this.events[event] as Function[])[index] = undefined;
			return callback;
		}
	}
	when (event: string, callback: Function) {
		event = event.toLowerCase();
		if (events.indexOf(event) > -1) {
			if (!Array.isArray(this.events[event]))
				this.events[event] = typeof this.events[event] == "function" ? [this.events[event] as Function] : [];
			const index = this.events[event].length;
			const cb = (...args: any[]) => {
				(this.events[event] as Function[])[index] = undefined;
				callback(...args);
			};
			(this.events[event] as Function[]).push(cb);
			(cb as any).cancel = (): any => (this.events[event] as Function[])[index] = undefined;
			return callback;
		}
	}
	connect (options: ClientOptions, callback?: Function) {
		this.twitch = new twitch.client({
			connection: { reconnect: true },
			identity: options.identity,
			channels: [options.channel],
		});
		this.channel = options.channel;
		this.username = options.identity.username;

		for (const event of events) {
			this.twitch.on(event, (...args: any[]) => {
				const eventCallbacks = this.events[event];
				if (Array.isArray(eventCallbacks)) {
					for (const eventCallback of eventCallbacks) if (eventCallback)
						eventCallback(...args.slice(1));
				} else if (typeof eventCallbacks == "function") eventCallbacks(...args);
			});
		}

		if (callback) this.when("Connected", callback);
		this.twitch.connect();
	}
	connectSync (options: ClientOptions) {
		let connected = false;
		this.connect(options, () => connected = true);
		sync.until(() => connected);
	}
	say (...what: any[]) {
		this.twitch.say(this.channel, what.join(" "));
	}
	whisper (to: string, ...what: any[]) {
		this.twitch.whisper(to.toLowerCase(), what.join(" "));
	}
}

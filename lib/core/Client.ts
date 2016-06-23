var twitch = require("tmi.js");
var sync = require("synchronicity");

var events = [
    "action", "chat", "clearchat", "whisper",
    "connected", "disconnected", "reconnect",
    "emoteonly", "emotesets",
    "hosted", "hosting",
    "join", "part",
    "logon", "mod", "mods",
    "notice","ping", "pong", "r9kbeta",
    "roomstate", "slowmode",
    "subanniversary", "subscribers", "subscription",
    "timeout", "unhost", "unmod"
];

export interface Options {
    identity: string;
    channel: string;
}

export class Client {
    twitch: any;
    events: { [key: string]: Function[] | Function };
    channel: string;
    username: string;

    constructor(options: Options) {
        this.events = {},
        this.twitch = new twitch.client({
            connection: { reconnect: true },
            identity: options.identity,
            channels: [options.channel]
        }),
        this.channel = options.channel,
        this.username = options.identity;

        var _this = this;

        for (var i = 0; i < events.length; i++) (function (event: string) {
            _this.twitch.on(event, function (...args: any[]) {
                var eventCallbacks = _this.events[event];
                if (Array.isArray(eventCallbacks)) {
                    for (var eventCallback of eventCallbacks) if (eventCallback) 
                        eventCallback(...args.slice(1));
                } else if (typeof eventCallbacks == "function") eventCallbacks(...args);
            });
        })(events[i]);
    }

    on (event: string, callback: Function) {
        event = event.toLowerCase();
        if (events.indexOf(event) > -1) {
            if (!Array.isArray(this.events[event])) 
                this.events[event] = typeof this.events[event] == "function" ? [this.events[event] as Function] : [];
            var index = this.events[event].length;
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
            var index = this.events[event].length;
            var cb = (...args: any[]) => {
                (this.events[event] as Function[])[index] = undefined;
                callback(...args);
            };
            (this.events[event] as Function[]).push(cb);
            (cb as any).cancel = (): any => (this.events[event] as Function[])[index] = undefined;
            return callback;
        }
    }
    connect (callback: Function) {
        this.when("Connected", callback);
        this.twitch.connect();
    }
    connectSync () {
        var connected = false;
        this.connect(() => connected = true);
        sync.until(() => connected);
    }
    say (...what: any[]) {
        this.twitch.say(this.channel, what.join(" "));
    }
}

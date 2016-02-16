var tmijs = require("tmi.js");
var protifier = require("protifier");

var events = [
    "action", "chat", "clearchat", "whisper",
    "connected", "connecting", "disconnected", "reconnect",
    "emoteonly", "emotesets",
    "hosted", "hosting",
    "join", "part",
    "logon", "mod", "mods",
    "notice","ping", "pong", "r9kbeta",
    "roomstate", "slowmode",
    "subanniversary", "subscribers", "subscription",
    "timeout", "unhost", "unmod"
];

var client = module.exports = function client (options) {
    var twitch = tmijs.client({
        connection: { reconnect: true },
        identity: options.identity,
        channels: [options.channel]
    });

    this.connect = twitch.connect.bind(twitch);
    this.twitch = twitch;

    this.e = {};
    protifier.bindDesc(this, "on");
    var on = this.on; this.on = {};
    Object.defineProperties(this.on, on);
    console.log(this.on);
};

client.prototype = {
    events: function (events, callback) {
        if (typeof events == "object") {
            for (var event in events) {
                this.twitch.on(event, events[event]);
            }
        } else if (typeof events == "string") {
            this.twitch.on(events, callback);
        }
    },
    on: {}
};

for (var i = 0; i < events.length; i++) {
    (function (event) {
        client.prototype.on[event] = {
            get: function () {
                console.log(this);
                return this.e[event];
            },
            set: function (val) {
                this.e[event] = val;
                this.twitch.on(event, val);
            }
        };
    })(events[i]);
}
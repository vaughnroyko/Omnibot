var tmijs = require("tmi.js");
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

var client = module.exports = function client (options) {
    this.events = {},
    this.twitch = new tmijs.client({
        connection: { reconnect: true },
        identity: options.identity,
        channels: [options.channel]
    }),
    this.channel = options.channel,
    this.username = options.identity;

    var _this = this;

    for (var i = 0; i < events.length; i++) (function (event) {
        _this.twitch.on(event, function () {
            var evcb = _this.events[event];
            if (Array.isArray(evcb)) {
                for (var i = 0; i < evcb.length; i++) {
                    if (evcb[i]) evcb[i].apply(null, arguments);
                }
            } else if (typeof evcb == "function") evcb.apply(null, arguments);
        });
    })(events[i]);
};

client.prototype = {
    on: function (event, callback) {
        event = event.toLowerCase();
        if (events.indexOf(event) > -1) {
            if (!Array.isArray(this.events[event])) this.events[event] = typeof this.events[event] == "function" ? [this.events[event]] : [];
            var index = this.events[event].length, _this = this;
            this.events[event].push(callback);
            callback.cancel = function () {
                _this.events[event][index] = undefined;
            };
            return callback;
        }
        return false;
    },
    connect: function (callback) {
        this.on("Connected", callback);
        this.twitch.connect();
    },
    connectSync: function () {
        var connected = false;
        this.on("Connected", () => connected = true);
        this.twitch.connect();
        sync.until(() => connected);
    }
};


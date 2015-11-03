exports.createLogger = function (name, level, type) {
    return require("bunyan").createLogger({
        name: name,
        streams: [
            {
                level: level,
                stream: {write: function (rec) {
                    throw new Error(rec.msg || rec.raw);
                }},
                type: type
            }
        ]
    });
};
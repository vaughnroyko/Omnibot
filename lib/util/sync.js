
var deasync = require('deasync');

var sync = module.exports = function () {
    var args = [];
    Array.prototype.push.apply(args, arguments);
    var f = args.shift();
    if (typeof f == "function") {
        f = deasync(f);
        return f.apply(null, args);
    }
    return null;
};

sync.create = function (f) {
    return deasync(f);
};
sync.sleep = deasync.sleep;
sync.until = function (predicate) {
    return deasync.loopWhile(function () {
        return !predicate();
    });
};
sync.exe = function (t, f, args) {
    var result = {result: undefined};
    for (var i = 0; i < args.length; i++) {
        if (typeof args[i] == "object" && args[i].name == "deferrer" && args[i].host == "sync") {
            var returns = args[i].returns;
            args[i] = function () {
                result.result = {};
                var args = [];
                Array.prototype.push.apply(args, arguments);
                var err = args.shift();
                if (err) throw err;
                else {
                    for (var i = 0; i < returns.length; i++) {
                        result.result[returns[i]] = arguments.length > i + 1 ? arguments[i + 1] : undefined;
                    }
                    for (var j = -1; (n = "_" + (j < 0 ? "" : j)) in result; j++);
                    for (result.result[n] = []; i < arguments.length; i++) {
                        result.result[n].push(arguments[i]);
                    }
                }
            };
        }
    }
    result.promise = t[f].apply(t, args);
    return result;
};
sync.wait = function (t, f, args) {
    f = sync.exe(t, f, args);
    deasync.loopWhile(function () { return !sync.promiseEnded(f.promise); });
    return f.result;
};
sync.defer = function () {
    return { name: 'deferrer', host: 'sync', returns: arguments };
};

sync.promiseEnded = function (promise) {
    return ('_closesGot' in promise && '_closesNeeded' in promise && promise._closesGot == promise._closesNeeded)
        || ('emitted' in promise && 'fulfill' in promise.emitted);
};

sync.parallel = function (fs) {
    var ps = [];
    for (var i = 0; i < fs.length; i++) {
        ps.push(sync.exe.apply(sync, fs[i]));
    }
    deasync.loopWhile(function () {
        var go = false;
        for (var i = 0; i < ps.length; i++) {
            if (!sync.promiseEnded(ps[i].promise)) go = true;
        }
        return go;
    });
    var result = [];
    for (var i = 0; i < ps.length; i++) {
        result.push(ps[i].result);
    }
    return result;
};
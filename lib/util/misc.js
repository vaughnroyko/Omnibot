Math.clamp = function (source, min, max) {
    return Math.min(Math.max(this, min), max);
};

if (!String.prototype.weave) {
    var weaving = require("weaving");
    weaving.library.add(require("weaving-chalk"));
    weaving.applyProtos(true);
}

if (!Array.prototype.includes) {
    Array.prototype.includes = function () {
        if (arguments.length == 0) return false;
        for (var i = 0; i < arguments.length; i++) {
            if (this.indexOf(arguments[i]) == -1) return false;
        }
        return true;
    }
}
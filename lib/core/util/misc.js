Math.clamp = function (source, min, max) {
    return Math.min(Math.max(this, min), max);
};

if (!String.prototype.weave) {
    var weaving = require("weaving");
    weaving.library.add(require("weaving-chalk"));
    weaving.applyProtos(true);
}
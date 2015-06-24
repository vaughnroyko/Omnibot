

if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return (typeof args[number] != 'undefined'
                ? args[number]
                : match
            );
        });
    };
}
if (!String.prototype.padLeft) {
    String.prototype.padLeft = function (length, padWith) {
        return (padWith + this).slice(-length);
    };
}
if (!String.prototype.padRight) {
    String.prototype.padRight = function (length, padWith) {
        return (padWith + this).slice(length);
    };
}
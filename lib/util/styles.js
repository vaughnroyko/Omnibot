
var chalk = global.modules.chalk;

var createStyle = function (cur, def) {
	if (def[0] == "#") {
		if (def.substring(1) in cur) {
			return cur[def.substring(1)];
		} else {
			return null;
		}
	} else {
		var result = chalk;
		def = def.split('.');
		for (var i = 0; i < def.length; i++) {
			result = result[def[i]];
		}
		return result;
	}
}
var createStyles = function (defs) {
	var result = {};
	for (var styleName in defs) {
		if (typeof defs[styleName] == "string") {
			var style = createStyle(result, defs[styleName]);
			if (style !== null) result[styleName] = style;
			else style = chalk.white;
		} else {
			result[styleName] = createStyles(defs[styleName]);
		}
	}
	return result;
};

module.exports = {
	process: createStyles
};
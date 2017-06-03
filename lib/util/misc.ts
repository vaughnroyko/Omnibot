interface Math {
	clamp (source: number, min: number, max: number): number;
}
Math.clamp = function (source, min, max) {
	return Math.min(Math.max(source, min), max);
};
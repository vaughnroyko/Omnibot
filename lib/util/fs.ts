import fs = require("fs-extra");

declare module "fs-extra" {
	/**
	 * Synchronous readFile - Synchronously reads the entire contents of a file.
	 *
	 * @param fileName
	 * @param encoding
	 */
	export function tryReadSync (filename: string, encoding: string): string;
    /**
     * Synchronous readFile - Synchronously reads the entire contents of a file.
     *
     * @param fileName
     * @param options An object with optional {encoding} and {flag} properties.  If {encoding} is specified, readFileSync returns a string; otherwise it returns a Buffer.
     */
	export function tryReadSync (filename: string, options: { encoding: string; flag?: string; }): string;
    /**
     * Synchronous readFile - Synchronously reads the entire contents of a file.
     *
     * @param fileName
     * @param options An object with optional {encoding} and {flag} properties.  If {encoding} is specified, readFileSync returns a string; otherwise it returns a Buffer.
     */
	export function tryReadSync (filename: string, options?: { flag?: string; }): Buffer;
}

const sync = require("synchronicity");

fs.tryReadSync = function (...args: any[]) {
	let result: any;
	try {
		result = (fs.readFileSync as any)(...args);
	} catch (err) {
		if (err.code != "ENOENT") throw err;
	}
	return result;
};

fs.moveSync = function (source: string, dest: string) {
	return sync.wait(fs, "move", [source, dest, {}, sync.defer()]);
};

export default fs;
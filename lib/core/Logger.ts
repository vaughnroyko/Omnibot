import path = require("path");
import util = require("util");

import { Console } from "consolemate";
const sync = require("synchronicity");

import fs from "../util/fs";


import { Util } from "weaving";

declare global {
	interface String {
		padLeft (len: number, pad: string): string;
	}
}
String.prototype.padLeft = function (len: number, pad: string) {
	return Util.padLeft(this, len, pad);
};


export class Logger {

	selected: string;
	timestamp: boolean;
	timestampFormat: any;

	constructor(public folder: string) {
		folder = path.resolve(process.cwd(), folder);
		fs.mkdirs(folder);

		let exists: boolean;
		if (exists = fs.existsSync(this.folder + "/last") && fs.readdirSync(this.folder + "/last").length > 0) {
			const t = fs.statSync(this.folder + "/last").mtime;
			const formats = {
				date: "{year}-{month}-{date}",
				time: "{hour}.{minute}.{second}",
			};
			const currentFolder = this.folder + "/" + Logger.getTimestamp(t, formats.date);
			fs.moveSync(this.folder + "/last", currentFolder + "/" + Logger.getTimestamp(t, formats.time));
			exists = false;
		}
		if (!exists) {
			const max = 10, delay = 100;
			let i = 0, err: Error;
			do {
				try {
					fs.mkdirsSync(this.folder + "/last");
					break;
				} catch (e) {
					if (e.code != "EPERM") throw e;
					err = e;
				}
				sync.sleep(delay);
			} while (i++ < max);
			if (i > 0) {
				if (i > max) throw err;
				Console.logLine("Momentary file issue, but was resolved. " + i + " (Disregard)");
			}
		}
	}

	/**
	 * Logs to the console and the selected file.
	 */
	log (...what: any[]) {
		if (typeof this.selected == "string") {
			this.logTo(this.selected, ...what);
		}
	}
	/**
	 * Logs to the console and to the file name provided.
	 */
	logTo (selection: string, ...args: any[]) {
		let result = "";

		for (const arg of args)
			result += " " + (typeof arg == "string" ? arg : util.inspect(arg));

		result = (this.timestamp ? Logger.getTimestamp(undefined,
			typeof this.timestampFormat == "string" ? this.timestampFormat : "{hour}:{minute}:{second}",
		) + " " : "") + result.slice(1);

		Console.logLine(result);
		fs.appendFileSync(this.folder + "/last/" + selection, "{#strip:{0}}\n".weave(result), "utf8");
	}
	withTimestamp (script: Function, ts: boolean) {
		const timestamp = this.timestamp; this.timestamp = ts === undefined ? true : !!ts;
		script();
		this.timestamp = timestamp;
	}

	private static months = [
		"January", "February", "March",
		"April", "May", "June",
		"July", "August", "September",
		"October", "November", "December",
	];
	/**
	 * Get a timestamp based off of a time and a weaving string.
	 */
	static getTimestamp (time = new Date(), format = "{year}-{month}-{date} {hour}:{minute}:{second}"): string {
		const hr = new String(time.getHours().toString().padLeft(2, "0"));
		Object.defineProperty(hr, "short", { value: (time.getHours() - 1) % 12 + 1 });
		return format.weave({
			year: time.getFullYear(),
			month: (time.getMonth() + 1).toString().padLeft(2, "0"),
			monthName: this.months[time.getMonth()],
			date: time.getDate().toString().padLeft(2, "0"),
			hour: hr,
			minute: time.getMinutes().toString().padLeft(2, "0"),
			second: time.getSeconds().toString().padLeft(2, "0"),
			anteMeridiem: time.getHours() > 11,
			postMeridiem: time.getHours() < 12,
		});
	}
}
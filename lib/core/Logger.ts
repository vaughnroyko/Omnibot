import fs = require("../util/fs");
import path = require("path");
import util = require("util");

import { Console } from "consolemate";

let sync = require("synchronicity");

export class Logger {

    selected: string;
    timestamp: boolean;
    timestampFormat: string;

    constructor (public folder: string) {
        folder = path.resolve(process.cwd(), folder);
        fs.mkdirs(folder);

        let exists: boolean;
        if (exists = fs.existsSync(this.folder + "/last") && fs.readdirSync(this.folder + "/last").length > 0) {
            let t = fs.statSync(this.folder + "/last").mtime;
            let formats = {
                date: "{year}-{month}-{date}",
                time: "{hour}.{minute}.{second}"
            };
            let currentFolder = this.folder + "/" + Logger.getTimestamp(t, formats.date);
            fs.moveSync(this.folder + "/last", currentFolder + "/" + Logger.getTimestamp(t, formats.time));
            exists = false;
        }
        if (!exists) {
            let i = 0, err: Error, max = 10, delay = 100;
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

        for (let i = 0; i < args.length; i++)
            result += " " + (typeof args[i] == "string" ? args[i] : util.inspect(args[i]));

        result = (this.timestamp ? Logger.getTimestamp(undefined,
            typeof this.timestampFormat == "string" ? this.timestampFormat : "{hour}:{minute}:{second}"
        ) + " " : "") + result.slice(1);

        Console.logLine(result);
        fs.appendFileSync(this.folder + "/last/" + selection, "{#strip:{0}}\n".weave(result), "utf8");
    }
    withTimestamp (script: Function, ts: boolean) {
        let timestamp = this.timestamp; this.timestamp = ts === undefined ? true : !!ts;
        script();
        this.timestamp = timestamp;
    }

    private static months = [
        "January", "February", "March",
        "April", "May", "June",
        "July", "August", "September",
        "October", "November", "December"
    ];
    /**
     * Get a timestamp based off of a time and a weaving string.
     */
    static getTimestamp (time = new Date(), format = "{year}-{month}-{date} {hour}:{minute}:{second}"): string {
        let hr = new String(time.getHours().toString().padLeft(2, '0'));
        Object.defineProperty(hr, "short", { value: (time.getHours() - 1) % 12 + 1});
        return format.weave({
            year: time.getFullYear(),
            month: (time.getMonth() + 1).toString().padLeft(2, '0'),
            monthName: this.months[time.getMonth()],
            date: time.getDate().toString().padLeft(2, '0'),
            hour: hr,
            minute: time.getMinutes().toString().padLeft(2, '0'),
            second: time.getSeconds().toString().padLeft(2, '0'),
            anteMeridiem: time.getHours() > 11,
            postMeridiem: time.getHours() < 12
        });
    }
}
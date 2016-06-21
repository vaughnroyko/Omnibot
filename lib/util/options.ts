import path = require("path");
import fs = require("./fs");

var season: any, _: any;

export type OptionsObject = { [key: string]: { [key: string]: any } };

var loadOptions = function (folder: string, files: string[]): OptionsObject {
    var result: OptionsObject = {};
    for (var file of files) {
        var filePath = path.join(folder, file);
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "");
        var obj = season.readFileSync(filePath);
        if (obj) result[file.split(".").shift()] = obj;
    }
    return result;
}

export class Options {

    private _list: string[];
    private _defaults: OptionsObject;
    private _folder: string;

    constructor (folder: string) {
        if (!season) season = require("season");
        if (!_) _ = require("underscore-plus");
        this._folder = folder = folder + "/";
        this._list = fs.readdirSync(folder + "defaults"), // list of all default option files
        this._defaults = loadOptions(folder + "defaults", this._list); // default options
    }
    
    get list () { return this._list; }
    get defaults () { return this._defaults; }
    get folder () { return this._folder; }

    
    load (): OptionsObject {
        return _.deepExtend({}, this._defaults, loadOptions(this._folder, this._list));
    }
}
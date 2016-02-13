var mongoose = require("mongoose");

mongoose.Document.prototype.edit = function (data, callback) {
    this.constructor.update(
        {_id: this._id},
        data,
        function () {
            if (typeof callback == "function") callback.apply(null, arguments);
        }
    );
};
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CategorySchema = new Schema({
    name: {
        type: String,
        min: 3,
        max: 40
    }
});

// Virtual for categoy's URL
CategorySchema
    .virtual('url')
    .get(function () {
        return '/category/' + this._id;
    });

//Export model
module.exports = mongoose.model('Category', CategorySchema);

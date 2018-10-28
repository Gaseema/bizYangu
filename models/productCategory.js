var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ProductCategorySchema = new Schema({
    name: {
        type: String,
        min: 3,
        max: 40
    },
    biz:{
        type: String,
        required: true
    },
});

// Virtual for product category's URL
ProductCategorySchema
    .virtual('url')
    .get(function () {
        return '/prodcategory/' + this._id;
    });

//Export model
module.exports = mongoose.model('ProductCategory', ProductCategorySchema);

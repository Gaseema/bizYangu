var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ProductSchema = new Schema({
    product_name: {
        type: String,
        required: true
    },
    product_price: {
        type: String,
        required: true
    },
    biz: {
        type: Schema.ObjectId,
        ref: 'Biz',
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    category: [{
        type: Schema.ObjectId,
        ref: 'Category',
        required: true
    }],
    product_pic: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    }
});

// Virtual for products's URL
ProductSchema
    .virtual('url')
    .get(function () {
        return '/product/' + this._id;
    });

//Export model
module.exports = mongoose.model('Product', ProductSchema);

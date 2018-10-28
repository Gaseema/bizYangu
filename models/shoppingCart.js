var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ShoppingCartSchema = new Schema({
    prodName: {
        type: String,
        min: 3,
        max: 40
    },
    user: {
        type: String,
        required: true
    },
    business: {
        type: String,
        required: true
    },
    quantity: {
        type: String,
        required: true
    }
});

// Virtual for product category's URL
ShoppingCartSchema
    .virtual('url')
    .get(function() {
        return '/shoppingcart/' + this._id;
    });

//Export model
module.exports = mongoose.model('ShoppingCart', ShoppingCartSchema);

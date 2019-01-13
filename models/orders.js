var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var OrderSchema = new Schema({
    biz_name: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    products: [{
        type: String,
        required: true
    }],
    time: {
        type: String,
        required: true
    }
});

// Virtual for order's URL
OrderSchema
    .virtual('url')
    .get(function() {
        return '/biz/:bizId/orders/' + this._id;
    });

//Export model
module.exports = mongoose.model('Order', OrderSchema);

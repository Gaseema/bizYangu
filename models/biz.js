var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var BizSchema = new Schema({
    biz_name: {
        type: String,
        required: true,
        max: 100
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    },
    category: [{
        type: Schema.ObjectId,
        ref: 'Category'
    }],
    location: {
        type: String,
        required: true
    },
    phoneNo: {
        type: String,
        required: true
    },
    biz_logo: {
        type: String
    },
    biz_banner: {
        type: String
    }
});

// Virtual for author's URL
BizSchema
    .virtual('url')
    .get(function () {
        return '/biz/' + this._id;
    });

//Export model
module.exports = mongoose.model('Biz', BizSchema);

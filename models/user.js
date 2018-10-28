var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    userName: String,
    googleId: String,
    email: String
})

// Virtual for user's URL
userSchema
    .virtual('url')
    .get(function () {
        return '/profile/' + this._id;
    });

//Export model
module.exports = mongoose.model('User', userSchema);
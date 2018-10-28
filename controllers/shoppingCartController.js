var Product = require('../models/product');
var User = require('../models/user');
var ShoppingCart = require('../models/shoppingCart');
var async = require('async');
const {
    body,
    validationResult
} = require('express-validator/check');
const {
    sanitizeBody
} = require('express-validator/filter');

// Display list of all Shopping Cart.
exports.shoppingcart_list = function(req, res) {
    req.session.returnTo = req.path;
    if (req.isAuthenticated()) {
        // Get all categories which we can use for adding to our book.
        async.parallel({
            shoppinglist: function(callback) {
                Product.find({
                        'user': req.user.id
                    })
                    .exec(callback)
            },
        }, function(err, results) {
            if (err) {
                return next(err);
            }
            res.render('shoppingcart', {
                title: 'Shopping Cart',
                prodList: results
            });
        });
    } else {
        res.render('login');
    }
};

// Display list of all Shopping Cart.
exports.bizShoppingcart_list = function(req, res) {
    req.session.returnTo = req.path;
    if (req.isAuthenticated()) {
        // Get all products for a specific business
        async.parallel({
            shoppinglist: function(callback) {
                ShoppingCart.find({
                    business: req.params.bizId
                }, function(err, result) {
                    for (prod in result) {
                        Product.find({
                                '_id': result[prod].prodName
                            })
                            .exec(callback)
                    }
                })
            },
        }, function(err, results) {
            if (err) {
                return next(err);
            }
            res.render('business_shoppingcart', {
                title: 'Shopping Cart',
                prodList: results
            });
        });
    } else {
        res.render('login')
    }
};

// Display detail page for a specific Genre.
exports.shoppingcart_detail = function(req, res, next) {
    req.session.returnTo = req.path;
    if (req.isAuthenticated()) {
        res.json("worked")
    } else {
        res.render('login')
    }
};

// Display Genre create form on GET.
exports.shoppingcart_create_get = function(req, res, next) {
    res.json("working")
};
// Handle Shopping Cart create on POST.
exports.shoppingcart_create_post = [

    // Validate that the name field is not empty.
    body('prodCatName', 'Product Category name required').isLength({
        min: 1
    }).trim(),

    // Sanitize (trim and escape) the name field.
    sanitizeBody('prodCatName').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Shopping Cart object with escaped and trimmed data.
        var shoppingcart = new ShoppingCart({
            prodName: req.body.prodName,
            user: req.body.user,
            business: req.body.business,
            quantity: req.body.quantity
        });

        ShoppingCart.findOne({
                'prodName': req.body.prodName
            })
            .exec(function(err, found_shoppingcart) {
                if (err) {
                    console.log(err)
                    return next(err);
                }

                if (found_shoppingcart) {
                    // Shopping Cart exists, saves additional info.
                    shoppingcart = parseInt(shoppingcart.quantity) + parseInt(found_shoppingcart.quantity)
                    ShoppingCart.update({
                        _id: found_shoppingcart._id
                    }, {
                        $set: {
                            quantity: shoppingcart
                        }
                    }, function(err) {
                        if (err) {
                            return next(err);
                        }
                        // Shopping Cart saved. Redirect to Shopping Cart detail page.
                        res.redirect(shoppingcart.url);
                    });
                } else {

                    shoppingcart.save(function(err) {
                        if (err) {
                            return next(err);
                        }
                        // Shopping Cart saved. Redirect to Shopping Cart detail page.
                        res.redirect(shoppingcart.url);
                    });

                }

            });
    }
];

// Display Shopping Cart delete form on GET.
exports.shoppingcart_delete_get = function(req, res, next) {
    req.session.returnTo = req.path;
    if (req.isAuthenticated()) {
        async.parallel({
            ShoppingCart: function(callback) {
                //Biz.find(callback);
                ShoppingCart.findById(req.params.id).exec(callback)
            },
        }, function(err, results) {
            if (err)
                return next(err);

            console.log(results)
            res.json(results);
        });
    } else {
        res.render('login')
    }
};

// Handle Shopping Cart delete on POST.
exports.shoppingcart_delete_post = function(req, res) {
    async.parallel({
        ShoppingCart: function(callback) {
            ShoppingCart.findById(req.body.prodcatid).exec(callback)
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        // Success
        // Remove the product
        ShoppingCart.findByIdAndRemove(req.params.id, function deleteShoppingCart(err) {
            if (err) {
                return next(err);
            }
            // Success - go to author list
            res.json(results);
        })
    });
    console.log("working here")
};

// Display Shopping Cart update form on GET.
exports.shoppingcart_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Product category update GET');
};

// Handle Shopping Cart update on POST.
exports.shoppingcart_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Product category update POST');
};

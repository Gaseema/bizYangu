const {
    body,
    validationResult
} = require('express-validator/check');
const {
    sanitizeBody
} = require('express-validator/filter');

var Product = require('../models/product');
var async = require('async');
var Biz = require('../models/biz');
var Category = require('../models/category');
var User = require('../models/user');
var ProductCategory = require('../models/productCategory');
var imageModuleReference = require('../app');

// Display list of all products.
exports.product_list = function(req, res, next) {
    Product.find({}, 'product_name biz')
        .populate('biz')
        .exec(function(err, list_products) {
            if (err) {
                return next(err);
            }
            //Successful, so render
            res.render('product_list', {
                title: 'Product List',
                product_list: list_products
            });
        });
};

// Display detail page for a specific product.
exports.product_detail = function(req, res, next) {
    req.session.returnTo = req.path;
    async.parallel({
        product: function(callback) {
            Product.findById(req.params.id)
                .populate('biz')
                .exec(callback);
        },
        product_recommend: function(callback) {
            Product.find({}, callback).limit(4)
        },
        bizs_categories: function(callback) {
            Product.findById(req.params.id, function(err, result) {
                ProductCategory.find({
                        'biz': result.biz
                    }, 'name _id')
                    .exec(callback)
            })
        },
        business: function(callback) {
            Biz.findById(req.params.bizId, function(err, result) {
                    if (err) {
                        console.log(err);
                    }
                })
                .exec(callback)
        },
        user: function(callback) {
            // Check if user is logged in to place an order
            if (req.isAuthenticated()) {
                callback(null, true)
            } else {
                callback(null, false)
            }
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        if (results.product == null) { // No results.
            var err = new Error('Product not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('product_detail', {
            title: 'Title',
            product: results.product,
            recommended: results.product_recommend,
            bizs_categories: results.bizs_categories,
            biz_id: results.product.biz._id,
            product_pic: `/uploads/${results.product.product_pic}`,
            active_biz: results.business,
            user: results.user,
        });
    });
};

// Display product create form on GET.
exports.product_create_get = function(req, res, next) {
    req.session.returnTo = req.path;
    if (req.isAuthenticated()) {
        // Get all Biz and categories, which we can use for adding to our product.
        User.findOne({
            googleId: req.user.id
        }, function(err, result) {
            if (err) throw err;
            async.parallel({
                bizs: function(callback) {
                    //Biz.find(callback);
                    Biz.find({
                        user: result.id
                    }, callback)
                },
                prodCategories: function(callback) {
                    //Biz.find(callback);
                    ProductCategory.find(callback);
                },
            }, function(err, results) {
                if (err) {
                    return next(err);
                }
                res.render('product_form', {
                    title: 'Create Product',
                    bizs: results.bizs,
                    prodCategories: results.prodCategories,
                    prodImage: req.body.myImage
                });
            });
        });
    } else {
        res.render('login');
    }
};

// Handle product create on POST.
exports.product_create_post = [
    // Sanitize fields (using wildcard).
    sanitizeBody('*').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create a Book object with escaped and trimmed data.
        imageModuleReference.upload(req, res, (err) => {
            if (err) {
                console.log(err)
            } else {
                if (req.file == undefined) {
                    console.log('Error: No File Selected!')
                } else {
                    var product = new Product({
                        product_name: req.body.product_name,
                        biz: req.body.biz,
                        category: req.body.name,
                        summary: req.body.summary,
                        product_pic: req.file.filename,
                        user: req.user.id,
                        product_price: req.body.product_price,
                    });
                    if (!errors.isEmpty()) {
                        // There are errors. Render form again with sanitized values/error messages.

                        // Get all businesses and categories for form.
                        async.parallel({
                            bizs: function(callback) {
                                Biz.find(callback)
                            },
                            prodCategories: function(callback) {
                                ProductCategory.find(callback)
                            },
                        }, function(err, results) {
                            if (err) {
                                return next(err);
                            }

                            res.render('product_form', {
                                product_name: 'Create Book',
                                bizs: results.bizs,
                                prodCategories: results.prodCategories,
                                errors: errors.array()
                            });
                        });
                        return;
                    } else {
                        // Data from form is valid. Save product.
                        product.save(function(err) {
                            if (err) {
                                return next(err);
                            }
                            //successful - redirect to new product record.
                            res.redirect(product.url);
                        });
                    }
                }
            }
        });
    }
];

// Display product delete form on GET.
exports.product_delete_get = function(req, res, next) {
    req.session.returnTo = req.path;
    if (req.isAuthenticated()) {
        // Get all Biz and categories, which we can use for adding to our product.
        async.parallel({
            product: function(callback) {
                //Biz.find(callback);
                Product.findById(req.params.id).exec(callback)
            },
        }, function(err, results) {
            if (err) {
                return next(err);
            }
            console.log(results)
            res.render('product_delete', {
                title: 'Delete Product',
                bizs: results.bizs,
                product: results.product
            });
        });
    } else {
        res.render('login');
    }
};

// Handle product delete on POST.
exports.product_delete_post = function(req, res, next) {
    async.parallel({
        product: function(callback) {
            Product.findById(req.body.productid).exec(callback)
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        // Success
        // Remove the product
        Product.findByIdAndRemove(req.body.productid, function deleteProduct(err) {
            if (err) {
                return next(err);
            }
            // Success - go to author list
            res.redirect('/products')
        })
    });
};

// Display product update form on GET.
exports.product_update_get = function(req, res, next) {
    // Get product, businesses and categories for form.
    User.findOne({
        googleId: req.user.id
    }, function(err, user) {
        async.parallel({
            product: function(callback) {
                Product.findById(req.params.id).populate('biz').populate('category').exec(callback);
            },
            bizs: function(callback) {
                //Biz.find(callback);
                Biz.find({
                    user: user.id
                }, callback)
            },
            prodCategories: function(callback) {
                //Biz.find(callback);
                ProductCategory.find(callback);
            },
        }, function(err, results) {
            if (err) {
                return next(err);
            }
            if (results.product == null) { // No results.
                var err = new Error('Product not found');
                err.status = 404;
                return next(err);
            }
            res.render('product_form', {
                title: 'Update Product',
                bizs: results.bizs,
                prodCategories: results.prodCategories,
                prodImage: req.body.myImage,
                product: results.product
            });
        });
    });
};

// Handle product update on POST.
exports.product_update_post = [
    // Sanitize fields (using wildcard).
    sanitizeBody('*').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Product object with escaped/trimmed data and old id.
        imageModuleReference.upload(req, res, (err) => {
            if (err) {
                console.log(err)
            } else {
                if (req.file == undefined) {
                    console.log('Error: No File Selected!')
                } else {
                    var product = new Product({
                        product_name: req.body.product_name,
                        biz: req.body.biz,
                        category: req.body.name,
                        summary: req.body.summary,
                        product_pic: req.file.filename,
                        product_price: req.body.product_price,
                        _id: req.params.id //This is required, or a new ID will be assigned!
                    });
                    if (!errors.isEmpty()) {
                        // There are errors. Render form again with sanitized values/error messages.

                        // Get all businesses and categories for form.
                        async.parallel({
                            bizs: function(callback) {
                                Biz.find(callback)
                            },
                            prodCategories: function(callback) {
                                ProductCategory.find(callback)
                            },
                        }, function(err, results) {
                            if (err) {
                                return next(err);
                            }

                            res.render('product_form', {
                                title: 'Update Product',
                                bizs: results.bizs,
                                prodCategories: results.prodCategories,
                                errors: errors.array()
                            });
                        });
                        return;
                    } else {
                        // Data from form is valid. Update the record.
                        Product.findByIdAndUpdate(req.params.id, product, {}, function(err, theproduct) {
                            if (err) {
                                return next(err);
                            }
                            // Successful - redirect to product detail page.
                            res.redirect(theproduct.url);
                        });
                    }
                }
            }
        })
    }
];

const {
    body,
    validationResult
} = require('express-validator/check');
const {
    sanitizeBody
} = require('express-validator/filter');

var Biz = require('../models/biz');
var Product = require('../models/product');
var Category = require('../models/category');
var User = require('../models/user');
var ProductCategory = require('../models/productCategory');
var App = require('../app');
var imageModuleReference = require('../app');
var fs = require('fs');

var async = require('async');

exports.index = function(req, res) {

    async.parallel({
        product_count: function(callback) {
            Product.count({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        biz_count: function(callback) {
            Biz.count({}, callback);
        },
        category_count: function(callback) {
            Category.count({}, callback);
        },
        user_count: function(callback) {
            User.count({}, callback);
        },
        prodcategory_count: function(callback) {
            ProductCategory.count({}, callback);
        },
        list_biz: function(callback) {
            Biz.find({}, callback)
        },
    }, function(err, results) {
        res.render('index', {
            title: 'Site Home Page',
            error: err,
            data: results
        });
    });
};


// Display list of all Biz.
exports.biz_list = function(req, res, next) {
    Biz.find()
        .exec(function(err, list_bisinesses) {
            if (err) {
                return next(err);
            }
            //Successful, so render
            res.render('biz_list', {
                title: 'Biz List',
                biz_list: list_bisinesses
            });
        });
};

// Display detail page for a specific Biz.
exports.biz_detail = function(req, res, next) {
    async.parallel({
        biz: function(callback) {
            Biz.findById(req.params.id)
                .exec(callback)
        },
        bizs_products: function(callback) {
            Product.find({
                    'biz': req.params.id
                }, 'product_name product_price category summary product_pic').limit(10)
                .exec(callback)
        },
        bizs_categories: function(callback) {
            ProductCategory.find({
                    'biz': req.params.id
                }, 'name _id')
                .exec(callback)
        },
        limited_cat_prod: function(callback) {
            ProductCategory.find({
                'biz': req.params.id
            }, 'name _id', function(err, result) {
                console.log(result)
                Product.find({
                        'category': result
                    }, 'product_name product_price product_pic', function(err, result) {
                        console.log("result")
                    })
                    .exec(callback)
            })
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        } // Error in API usage.
        if (results.biz == null) { // No results.
            var err = new Error('Business not found');
            err.status = 404;
            return next(err);
        }
        if (req.user == undefined) {
            var activeUser = "none"
        } else {
            var activeUser = req.user.id
        }
        res.render('biz_detail', {
            title: 'Business Detail',
            biz: results.biz,
            biz_products: results.bizs_products,
            biz_logo: `/uploads/${results.biz.biz_logo}`,
            biz_banner: `/uploads/${results.biz.biz_banner}`,
            biz_id: results.biz.id,
            active_user: activeUser,
            biz_categories: results.bizs_categories,
            limited_cat_prod: results.limited_cat_prod,
        });
    });
};

// Display Biz create form on GET.
exports.biz_create_get = function(req, res, next) {
    req.session.returnTo = req.path;
    if (req.isAuthenticated()) {
        // Get all categories which we can use for adding to our book.
        async.parallel({
            categories: function(callback) {
                Category.find(callback);
            },
        }, function(err, results) {
            if (err) {
                return next(err);
            }
            res.render('biz_form', {
                title: 'Create Business',
                categories: results.categories
            });
        });
    } else {
        res.render('login')
    }
};

// Handle Biz create on POST.
exports.biz_create_post = [

    // Sanitize fields.
    sanitizeBody('*').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        imageModuleReference.upload(req, res, (err) => {
            var bizLogo = req.files[0].filename
            var bizBanner = req.files[1].filename
            if (err) {
                console.log(err)
                req.session.returnTo = req.path;
                if (req.isAuthenticated()) {
                    // Get all categories which we can use for adding to our book.
                    async.parallel({
                        categories: function(callback) {
                            Category.find(callback);
                        },
                    }, function(error, results) {
                        if (error) {
                            return next(error);
                        }
                        res.render('biz_form', {
                            title: 'Create Business',
                            categories: results.categories,
                            errors: err
                        });
                    });
                } else {
                    res.render('login')
                }
            } else {
                if (req.files == undefined) {
                    console.log('Error: No File Selected!')
                } else {
                    // Create a Biz object with escaped and trimmed data.
                    User.findOne({
                        googleId: req.user.id
                    }, function(err, result) {
                        if (err) throw err;
                        var biz = new Biz({
                            biz_name: req.body.biz_name,
                            user: result.id,
                            category: req.body.name,
                            location: req.body.location,
                            phoneNo: req.body.phoneNo,
                            biz_logo: bizLogo,
                            biz_banner: bizBanner
                        });
                        if (!errors.isEmpty()) {

                            // Get all businesses and categories for form.
                            async.parallel({
                                categories: function(callback) {
                                    Category.find(callback)
                                },
                            }, function(err, results) {
                                if (err) {
                                    return next(err);
                                }

                                res.render('biz_form', {
                                    product_name: 'Create Business',
                                    biz: req.body,
                                    categories: results.categories,
                                    bizImage: req.body.myImage,
                                    errors: errors.array()
                                });
                            });
                            return;
                        } else {
                            // Data from form is valid. Save product.
                            biz.save(function(err) {
                                if (err) {
                                    return next(err);
                                }
                                //successful - redirect to new product record.
                                res.redirect('/profile');
                            });
                        }
                    });
                }
            }
        })
    }
];

// Display Biz delete form on GET.
exports.biz_delete_get = function(req, res, next) {
    async.parallel({
        biz: function(callback) {
            Biz.findById(req.params.id).exec(callback)
        },
        bizs_products: function(callback) {
            Product.find({
                'biz': req.params.id
            }).exec(callback)
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        if (results.biz == null) { // No results.
            res.redirect('/biz');
        }
        // Successful, so render.
        res.render('biz_delete', {
            title: 'Delete Business',
            biz: results.biz,
            biz_counter: results.bizs_products.length,
            biz_products: results.bizs_products
        });
    });
};

// Handle Biz delete on POST.
exports.biz_delete_post = function(req, res, next) {
    async.parallel({
        biz: function(callback) {
            Biz.findById(req.body.bizid).exec(callback)
        },
        bizs_products: function(callback) {
            Product.find({
                'biz': req.body.bizid
            }).exec(callback)
        },
        bizs_prodCategories: function(callback) {
            ProductCategory.find({
                'biz': req.body.bizid
            }).exec(callback)
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        // Success
        Biz.findByIdAndRemove(req.body.bizid, function deleteBiz(err) {
            if (err) {
                console.log(err)
                return next(err);
            }
            fs.unlink("./public/uploads/" + results.biz.biz_banner, (err) => {
                if (err) {
                    console.log("failed to delete local banner image:" + err);
                }
            });
            fs.unlink("./public/uploads/" + results.biz.biz_logo, (err) => {
                if (err) {
                    console.log("failed to delete local logo image:" + err);
                }
            });
            var productsDelete = [];
            var productCatsDelete = [];
            for (prodID in results.bizs_products) {
                productsDelete.push(results.bizs_products[prodID].id);
                Product.remove({
                    '_id': {
                        '$in': productsDelete
                    }
                }, function(err) {
                    if (err) {
                        console.log(err);
                        return next(err);
                    }
                });
            }
            for (prodCatID in results.bizs_prodCategories) {
                productCatsDelete.push(results.bizs_prodCategories[prodCatID].id);
                ProductCategory.remove({
                    '_id': {
                        '$in': productCatsDelete
                    }
                }, function(err) {
                    if (err) {
                        console.log(err);
                        return next(err);
                    }
                });
            }
            // Success - go to business list
            res.redirect('/profile')
        })
    });
};

// Display Biz update form on GET.
exports.biz_update_get = function(req, res, next) {
    req.session.returnTo = req.path;
    if (req.isAuthenticated()) {
        // Get all categories which we can use for adding to our business.
        async.parallel({
            biz: function(callback) {
                Biz.findById(req.params.id).populate('category').exec(callback);
            },
            categories: function(callback) {
                Category.find(callback);
            },
            bizs_products: function(callback) {
                Product.find({
                        'biz': req.params.id
                    }, 'product_name category summary product_pic')
                    .exec(callback)
            },
            bizs_categories: function(callback) {
                ProductCategory.find({
                        'biz': req.params.id
                    }, 'name')
                    .exec(callback)
            },
        }, function(err, results) {
            if (err) {
                return next(err);
            }
            if (results.biz == null) {
                // No results.
                var err = new Error('Business not found');
                err.status = 404;
                return next(err);
            }
            res.render('biz_form', {
                title: 'Manage Business',
                categories: results.categories,
                biz: results.biz,
                biz_products: results.bizs_products,
                bizs_categories: results.bizs_categories
            });
        });
    } else {
        res.render('login')
    }
};

// Handle Biz update on POST.
exports.biz_update_post = [

    // Sanitize fields.
    sanitizeBody('*').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        imageModuleReference.upload(req, res, (err) => {
            if (err) {
                console.log(err)
            } else {
                if (req.files == undefined) {
                    console.log('Error: No File Selected!')
                } else {
                    // Create a Biz object with escaped and trimmed data.
                    User.findOne({
                        googleId: req.user.id
                    }, function(err, result) {
                        if (err) throw err;
                        var biz = new Biz({
                            biz_name: req.body.biz_name,
                            user: result.id,
                            category: req.body.name,
                            biz_logo: req.files[0].filename,
                            biz_banner: req.files[1].filename,
                            _id: req.params.id //This is required, or a new ID will be assigned!
                        });
                        if (!errors.isEmpty()) {

                            // Get all businesses and categories for form.
                            async.parallel({
                                categories: function(callback) {
                                    Category.find(callback)
                                },
                            }, function(err, results) {
                                if (err) {
                                    return next(err);
                                }

                                res.render('biz_form', {
                                    product_name: 'Create Business',
                                    biz: req.body,
                                    categories: results.categories,
                                    bizLogo: req.body.businessLogo,
                                    bizImage: req.body.myImage,
                                    errors: errors.array()
                                });
                            });
                            return;
                        } else {
                            // Data from form is valid. Update the record.
                            Biz.findByIdAndUpdate(req.params.id, biz, {}, function(err, thebiz) {
                                if (err) {
                                    return next(err);
                                }
                                // Successful - redirect to business detail page.
                                res.redirect(thebiz.url);
                            });
                        }
                    });
                }
            }
        })
    }
];

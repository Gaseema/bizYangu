var Product = require('../models/product');
var async = require('async');
var ProductCategory = require('../models/productCategory');

const {
    body,
    validationResult
} = require('express-validator/check');
const {
    sanitizeBody
} = require('express-validator/filter');

// Display list of all Genre.
exports.prodcategory_list = function(req, res) {
    ProductCategory.find()
        .exec(function(err, list_prodcategory) {
            if (err) {
                return next(err);
            }
            //Successful, so render
            res.render('prodCategory_list', {
                title: 'Category List',
                category_list: list_prodcategory
            });
        });
};

// Display detail page for a specific Genre.
exports.prodcategory_detail = function(req, res) {
    async.parallel({
        prodCategory: function(callback) {
            ProductCategory.findById(req.params.id)
                .exec(callback);
        },

        prodCategory_products: function(callback) {
            Product.find({
                    'category': req.params.id
                })
                .exec(callback);
        },
        bizs_categories: function(callback) {
            ProductCategory.find({
                    'biz': req.params.bizId
                }, function(err, result) {})
                .exec(callback)
        },

    }, function(err, results) {
        if (err) {
            return next(err);
        }
        if (results.prodCategory == null) { // No results.
            var err = new Error('Product Category not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        console.log(results.prodCategory_products)
        res.render('prodCategory_detail', {
            title: 'Category results',
            prodCategory: results.prodCategory,
            prodCategory_products: results.prodCategory_products,
            bizs_categories: results.bizs_categories,
            biz_id: results.prodCategory.biz,
        });
    });
};

// Display Genre create form on GET.
exports.prodcategory_create_get = function(req, res, next) {
    res.render('prodCategory_form', {
        title: 'Create Product Category'
    });
};

// Handle Genre create on POST.
exports.prodcategory_create_post = [

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

        // Create a genre object with escaped and trimmed data.
        var prodCategory = new ProductCategory({
            name: req.body.name,
            biz: req.body.biz
        });


        ProductCategory.findOne({
                'name': req.body.name
            })
            .exec(function(err, found_prodCategory) {
                if (err) {
                    return next(err);
                }

                if (found_prodCategory) {
                    // Genre exists, redirect to its detail page.
                    res.redirect(found_prodCategory.url);
                } else {

                    prodCategory.save(function(err) {
                        if (err) {
                            return next(err);
                        }
                        // Genre saved. Redirect to genre detail page.
                        res.redirect(prodCategory.url);
                    });

                }

            });

        //        if (!errors.isEmpty()) {
        //            // There are errors. Render the form again with sanitized values/error messages.
        //            res.render('prodCategory_form', {
        //                title: 'Create Product Category',
        //                prodCategory: prodCategory,
        //                errors: errors.array()
        //            });
        //            return;
        //        } else {
        //            // Data from form is valid.
        //            // Check if Genre with same name already exists.
        //            ProductCategory.findOne({
        //                    'name': req.body.name
        //                })
        //                .exec(function (err, found_prodCategory) {
        //                    if (err) {
        //                        return next(err);
        //                    }
        //
        //                    if (found_prodCategory) {
        //                        // Genre exists, redirect to its detail page.
        //                        res.redirect(found_prodCategory.url);
        //                    } else {
        //
        //                        prodCategory.save(function (err) {
        //                            if (err) {
        //                                return next(err);
        //                            }
        //                            // Genre saved. Redirect to genre detail page.
        //                            res.redirect(prodCategory.url);
        //                        });
        //
        //                    }
        //
        //                });
        //        }
    }
];

// Display Genre delete form on GET.
exports.prodcategory_delete_get = function(req, res, next) {
    req.session.returnTo = req.path;
    if (req.isAuthenticated()) {
        // Get all Biz and categories, which we can use for adding to our product.
        async.parallel({
            productCategory: function(callback) {
                //Biz.find(callback);
                ProductCategory.findById(req.params.id).exec(callback)
            },
        }, function(err, results) {
            if (err) {
                return next(err);
            }
            res.json(results);
        });
    } else {
        res.render('login')
    }
};

// Handle Genre delete on POST.
exports.prodcategory_delete_post = function(req, res) {
    async.parallel({
        productCategory: function(callback) {
            ProductCategory.findById(req.body.prodcatid).exec(callback)
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        // Success
        // Remove the product
        ProductCategory.findByIdAndRemove(req.params.id, function deleteProductCategory(err) {
            if (err) {
                return nex(err);
            }
            // Success - go to author list
            res.json(results);
        })
    });
};

// Display Genre update form on GET.
exports.prodcategory_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Product category update GET');
};

// Handle Genre update on POST.
exports.prodcategory_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Product category update POST');
};

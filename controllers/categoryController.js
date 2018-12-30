var Biz = require('../models/biz');
var async = require('async');
var Category = require('../models/category');

const {
    body,
    validationResult
} = require('express-validator/check');
const {
    sanitizeBody
} = require('express-validator/filter');

// Display list of all category.
exports.category_list = function(req, res, next) {
    Category.find()
        .exec(function(err, list_categories) {
            if (err) {
                return next(err);
            }
            //Successful, so render
            res.render('category_list', {
                title: 'Category List',
                category_list: list_categories
            });
        });
};

// Display detail page for a specific Category.
exports.category_detail = function(req, res, next) {
    async.parallel({
        category: function(callback) {
            Category.findById(req.params.id)
                .exec(callback);
        },

        category_biz: function(callback) {
            Biz.find({
                    'category': req.params.id
                })
                .exec(callback);
        },
        all_categories: function(callback) {
            ProductCategory.find({
                    'biz': req.params.id
                }, 'name _id')
                .exec(callback)
        }
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        if (results.category == null) { // No results.
            var err = new Error('Category not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        console.log(results.all_categories)
        res.render('category_detail', {
            title: 'Category Detail',
            category: results.category,
            category_biz: results.category_biz,
            all_categories: results.all_categories
        });
    });

};

// Display Category create form on GET.
exports.category_create_get = function(req, res) {
    res.render('category_form', {
        title: 'Create Category'
    });
};

// Handle Category create on POST.
exports.category_create_post = [

    // Validate that the name field is not empty.
    body('name', 'Category name required').isLength({
        min: 1
    }).trim(),

    // Sanitize (trim and escape) the name field.
    sanitizeBody('name').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        var category = new Category({
            name: req.body.name
        });


        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('category_form', {
                title: 'Create Category',
                category: category,
                errors: errors.array()
            });
            return;
        } else {
            // Data from form is valid.
            // Check if Category with same name already exists.
            Category.findOne({
                    'name': req.body.name
                })
                .exec(function(err, found_category) {
                    if (err) {
                        return next(err);
                    }

                    if (found_category) {
                        // Category exists, redirect to its detail page.
                        res.redirect(found_category.url);
                    } else {

                        category.save(function(err) {
                            if (err) {
                                return next(err);
                            }
                            // Category saved. Redirect to genre detail page.
                            res.redirect(category.url);
                        });

                    }

                });
        }
    }
];

// Display Category delete form on GET.
exports.category_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: category delete GET');
};

// Handle Category delete on POST.
exports.category_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: category delete POST');
};

// Display Category update form on GET.
exports.category_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: category update GET');
};

// Handle Category update on POST.
exports.category_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: category update POST');
};

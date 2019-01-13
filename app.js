var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var auth = require('./auth');
var cookieSession = require('cookie-session');
var User = require('./models/user');
var multer = require('multer');
var path = require('path');
var Biz = require('./models/biz');
var Product = require('./models/product');
var ProductCategory = require('./models/productCategory');

var express = require('express');
var app = require('express')();

var async = require('async');

// Require controller modules.
var product_controller = require('./controllers/productController');
var biz_controller = require('./controllers/bizController');
var category_controller = require('./controllers/categoryController');
var prodcategory_controller = require('./controllers/productCategoryController');
var shoppingcart_controller = require('./controllers/shoppingCartController');
var orders_controller = require('./controllers/ordersController');

var indexapp = require('./routes/index');
var usersapp = require('./routes/users');
var catalog = require('./routes/catalog'); //Import routes for "catalog" area of site

// Set The Storage Engine
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init Upload
exports.upload = multer({
    storage: storage
}).array('myImage', 2);

// Check File Type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

var app = express();

//Set up mongoose connection
var mongoose = require('mongoose');
var mongoDB = 'mongodb://gaseema:codingchamp@ds227459.mlab.com:27459/bizyangu';
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexapp);
app.use('/users', usersapp);
app.use('/', catalog); // Add catalog routes to middleware chain.

//Passport
auth(passport);

app.use(cookieParser());
app.use(cookieSession({
    genid: (req) => {
        console.log('Inside the session middleware')
        console.log(req.sessionID)
        return uuid() // use UUIDs for session IDs
    },
    name: 'session',
    keys: ['SECRECt'],
    maxAge: 24 * 60 * 60 * 1000
}));
app.use(passport.initialize());
app.use(passport.session());

// Search Results For Business
app.get('/search', (req, res, next) => {
    Product.find({
        biz: req.query.biz,
        product_name: {
            $regex: req.query.q,
            $options: '-i'
        }
    }, function(err, data) {
        console.log(data)
        res.json(data)
    })
});
// Search Results For Business
app.get('/prodCategory', (req, res, next) => {
    ProductCategory.find({
        biz: req.query.q
    }, function(err, data) {
        res.json(data)
    })
});

// Profile Page
app.get('/profile', (req, res, next) => {
    req.session.returnTo = "/profile";
    if (req.session.token) {
        res.cookie('token', req.session.token);
        User.findOne({
            googleId: req.user.id
        }, function(err, result) {
            Biz.find({
                    'user': result.id
                }, 'biz_name biz_banner')
                .exec(function(err, list_bisinesses) {
                    if (err) {
                        return next(err);
                    }
                    //Successful, so render
                    res.render('profile', {
                        title: 'Settings',
                        userName: req.session.passport.user.displayName,
                        userEmail: req.session.passport.user.emails[0].value,
                        userPhoto: req.session.passport.user.photos[0].value,
                        biz_list: list_bisinesses
                    });
                })
        });
    } else {
        res.cookie('token', '')
        //        res.json({
        //            status: 'Login to proceed'
        //        });
        res.render('login');
        console.log('session cookie not set')
    }
});

/// poduct ROUTES ///

// GET catalog home page.
app.get('/', biz_controller.index);

// GET request for creating a product. NOTE This must come before routes that display product (uses id).
app.get('/product/create', product_controller.product_create_get);

// POST request for creating product.
app.post('/product/create', product_controller.product_create_post);

// GET request to delete product.
app.get('/product/:id/delete', product_controller.product_delete_get);

// POST request to delete product.
app.post('/product/:id/delete', product_controller.product_delete_post);

// GET request to update product.
app.get('/product/:id/update', product_controller.product_update_get);

// POST request to update product.
app.post('/product/:id/update', product_controller.product_update_post);

// GET request for one product.
app.get('/biz/bizId=:bizId/product/prodId=:id', product_controller.product_detail);

// GET request for list of all product items.
app.get('/products', product_controller.product_list);

/// biz ROUTES ///

// GET request for creating biz. NOTE This must come before route for id (i.e. display biz).
app.get('/biz/create', biz_controller.biz_create_get);

// POST request for creating biz.
app.post('/biz/create', biz_controller.biz_create_post);

// GET request to delete biz.
app.get('/biz/:id/delete', biz_controller.biz_delete_get);

// POST request to delete biz.
app.post('/biz/:id/delete', biz_controller.biz_delete_post);

// GET request to update biz.
app.get('/biz/:id/update', biz_controller.biz_update_get);

// POST request to update biz.
app.post('/biz/:id/update', biz_controller.biz_update_post);

// GET request for one biz.
app.get('/biz/:id', biz_controller.biz_detail);

// GET request for list of all biz.
app.get('/biz', biz_controller.biz_list);

/// category ROUTES ///

// GET request for creating a category. NOTE This must come before route that displays category (uses id).
app.get('/category/create', category_controller.category_create_get);

//POST request for creating category.
app.post('/category/create', category_controller.category_create_post);

// GET request to delete category.
app.get('/category/:id/delete', category_controller.category_delete_get);

// POST request to delete category.
app.post('/category/:id/delete', category_controller.category_delete_post);

// GET request to update category.
app.get('/category/:id/update', category_controller.category_update_get);

// POST request to update category.
app.post('/category/:id/update', category_controller.category_update_post);

// GET request for one category.
app.get('/category/:id', category_controller.category_detail);

// GET request for list of all category.
app.get('/categories', category_controller.category_list);

/// Product Category ROUTES ///

// GET request for creating a prodcategory. NOTE This must come before route that displays prodcategory (uses id).
app.get('/prodcategory/create', prodcategory_controller.prodcategory_create_get);

//POST request for creating prodcategory.
app.post('/prodcategory/create', prodcategory_controller.prodcategory_create_post);

// GET request to delete prodcategory.
app.get('/prodcategory/:id/delete', prodcategory_controller.prodcategory_delete_get);

// POST request to delete prodcategory.
app.post('/prodcategory/:id/delete', prodcategory_controller.prodcategory_delete_post);

// GET request to update prodcategory.
app.get('/prodcategory/:id/update', prodcategory_controller.prodcategory_update_get);

// POST request to update prodcategory.
app.post('/prodcategory/:id/update', prodcategory_controller.prodcategory_update_post);

// GET request for one prodcategory.
app.get('/biz/:bizId/prodcategory/:id', prodcategory_controller.prodcategory_detail);

// GET request for list of all prodcategory.
app.get('/prodcategories', prodcategory_controller.prodcategory_list);


/// Shopping Cart ROUTES ///

// GET request for creating a prodcategory. NOTE This must come before route that displays prodcategory (uses id).
app.get('/shoppingcart/create', shoppingcart_controller.shoppingcart_create_get);

//POST request for creating prodcategory.
app.post('/shoppingcart/create', shoppingcart_controller.shoppingcart_create_post);

// GET request to delete prodcategory.
app.get('/shoppingcart/:id/delete', shoppingcart_controller.shoppingcart_delete_get);

// POST request to delete prodcategory.
app.post('/shoppingcart/:id/delete', shoppingcart_controller.shoppingcart_delete_post);

// GET request to update prodcategory.
app.get('/shoppingcart/:id/update', shoppingcart_controller.shoppingcart_update_get);

// POST request to update prodcategory.
app.post('/shoppingcart/:id/update', shoppingcart_controller.shoppingcart_update_post);

// GET request for one prodcategory.
// app.get('/shoppingcart/:id', shoppingcart_controller.shoppingcart_detail);

// GET request for list of all shopping cart items across all businesses.
app.get('/shoppingcart', shoppingcart_controller.shoppingcart_list);

// GET request for list shopping cart for a specific business.
app.get('/shoppingcart/biz=:bizId', shoppingcart_controller.bizShoppingcart_list);

/// Orders ROUTES ///
// Get request for orders
//app.get('/shoppingcart/create', orders_controller.order_create_get);
// POST request for orders.
//app.post('/shoppingcart/create', orders_controller.order_create_post);

app.get('/logout', (req, res) => {
    if(req.session.returnTo.includes('/biz/')){
        req.logout();
        res.redirect(req.session.returnTo || '/');
        req.session = null;
    }else{
        req.logout();
        res.redirect('/');
    }
});

app.get('/auth/google', passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ]
}));

app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/'
    }),
    (req, res) => {
        req.session.token = req.user.token;
        req.currentUserId = req.user.token;
        res.redirect(req.session.returnTo || '/');
        delete req.session.returnTo;
    }
);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

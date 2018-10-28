#! /usr/bin/env node

console.log('This script populates some test books, authors, genres and bookinstances to your database. Specified database as argument - e.g.: populatedb mongodb://your_username:your_password@your_dabase_url');

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
if (!userArgs[0].startsWith('mongodb://')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}

var async = require('async')
var Product = require('./models/product')
var Biz = require('./models/biz')
var Category = require('./models/category')


var mongoose = require('mongoose');
var mongoDB = userArgs[0];
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

var bizs = []
var categories = []
var products = []

function bizCreate(biz_name, cb) {
    bizdetail = {
        biz_name: biz_name
    }

    var biz = new Biz(bizdetail);

    biz.save(function (err) {
        if (err) {
            cb(err, null)
            return
        }
        console.log('New biz: ' + biz);
        bizs.push(biz)
        cb(null, biz)
    });
}

function categoryCreate(name, cb) {
    var category = new Category({
        name: name
    });

    category.save(function (err) {
        if (err) {
            cb(err, null);
            return;
        }
        console.log('New category: ' + category);
        categories.push(category)
        cb(null, category);
    });
}

function productCreate(product_name, summary, biz, genre, cb) {
    productdetail = {
        product_name: title,
        summary: summary,
        biz: biz
    }
    if (category != false) productdetail.category = category

    var product = new Product(productdetail);
    product.save(function (err) {
        if (err) {
            cb(err, null)
            return
        }
        console.log('New product: ' + product);
        products.push(product)
        cb(null, product)
    });
}


function createCategoryBizs(cb) {
    async.parallel([
        function (callback) {
                bizCreate('BizOne', callback);
        },
        function (callback) {
                bizCreate('BizTwo', callback);
        },
        function (callback) {
                bizCreate('BizThree', callback);
        },
        function (callback) {
                bizCreate('BizFour', callback);
        },
        function (callback) {
                bizCreate('BizFive', callback);
        },
        function (callback) {
                categoryCreate("Electronic", callback);
        },
        function (callback) {
                categoryCreate("Food", callback);
        },
        function (callback) {
                categoryCreate("Drinks", callback);
        },
        ],
        // optional callback
        cb);
}


function createProducts(cb) {
    async.parallel([
        function (callback) {
                productCreate('The Name of the Wind (The Kingkiller Chronicle, #1)', 'I have stolen princesses back from sleeping barrow kings. I burned down the town of Trebon. I have spent the night with Felurian and left with both my sanity and my life. I was expelled from the University at a younger age than most people are allowed in. I tread paths by moonlight that others fear to speak of during day. I have talked to Gods, loved women, and written songs that make the minstrels weep.', '9781473211896', bizs[0], [categories[0], ], callback);
        },
        function (callback) {
                productCreate("The Wise Man's Fear (The Kingkiller Chronicle, #2)", 'Picking up the tale of Kvothe Kingkiller once again, we follow him into exile, into political intrigue, courtship, adventure, love and magic... and further along the path that has turned Kvothe, the mightiest magician of his age, a legend in his own time, into Kote, the unassuming pub landlord.', '9788401352836', bizs[0], [categories[0], ], callback);
        },
        function (callback) {
                productCreate("The Slow Regard of Silent Things (Kingkiller Chronicle)", 'Deep below the University, there is a dark place. Few people know of it: a broken web of ancient passageways and abandoned rooms. A young woman lives there, tucked among the sprawling tunnels of the Underthing, snug in the heart of this forgotten place.', '9780756411336', bizs[0], [categories[0], ], callback);
        },
        function (callback) {
                productCreate("Apes and Angels", "Humankind headed out to the stars not for conquest, nor exploration, nor even for curiosity. Humans went to the stars in a desperate crusade to save intelligent life wherever they found it. A wave of death is spreading through the Milky Way galaxy, an expanding sphere of lethal gamma ...", '9780765379528', bizs[1], [categories[1], ], callback);
        },
        function (callback) {
                productCreate("Death Wave", "In Ben Bova's previous novel New Earth, Jordan Kell led the first human mission beyond the solar system. They discovered the ruins of an ancient alien civilization. But one alien AI survived, and it revealed to Jordan Kell that an explosion in the black hole at the heart of the Milky Way galaxy has created a wave of deadly radiation, expanding out from the core toward Earth. Unless the human race acts to save itself, all life on Earth will be wiped out...", '9780765379504', bizs[1], [categories[1], ], callback);
        },
        function (callback) {
                productCreate('Test Book 1', 'Summary of test book 1', 'ISBN111111', bizs[4], [categories[0], categories[1]], callback);
        },
        function (callback) {
                productCreate('Test Book 2', 'Summary of test book 2', 'ISBN222222', bizs[4], false, callback)
        }
        ],
        // optional callback
        cb);
}


async.series([
    createCategoryBizs,
    createProducts
],
    // Optional callback
    function (err, results) {
        if (err) {
            console.log('FINAL ERR: ' + err);
        }
        // All done, disconnect from database
        mongoose.connection.close();
    });

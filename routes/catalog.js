var express = require('express');
var router = express.Router();

// Require controller modules.
var product_controller = require('../controllers/productController');
var biz_controller = require('../controllers/bizController');
var category_controller = require('../controllers/categoryController');

// GET catalog home page.
router.get('/', biz_controller.index);

module.exports = router;

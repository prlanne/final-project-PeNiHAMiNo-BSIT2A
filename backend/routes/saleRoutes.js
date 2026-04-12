const express = require('express');
const router = express.Router();
const { recordSale } = require('../controllers/saleController');

router.post('/', recordSale);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getPurchases, addPurchase } = require('../controllers/purchaseController');

router.get('/', getPurchases);
router.post('/add', addPurchase);

module.exports = router;

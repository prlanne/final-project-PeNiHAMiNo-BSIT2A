const express = require('express');
const router = express.Router();
const { getPurchases, addPurchase } = require('../controllers/purchaseController');
const protect = require('../middleware/authMiddleware'); // ✅ FIX: Import auth middleware

// ✅ FIX: All routes now require a valid JWT token
router.get('/', protect, getPurchases);
router.post('/add', protect, addPurchase);

module.exports = router;
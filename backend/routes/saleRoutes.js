const express = require('express');
const router = express.Router();
const { recordSale, getSales } = require('../controllers/saleController');
const protect = require('../middleware/authMiddleware'); // ✅ FIX: Import auth middleware

// ✅ FIX: All routes now require a valid JWT token
router.get('/', protect, getSales);
router.post('/', protect, recordSale);

module.exports = router;
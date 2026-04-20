const express = require('express');
const router = express.Router();
const { createProduct, getProducts, deleteProduct } = require('../controllers/productController');
const protect = require('../middleware/authMiddleware'); // ✅ FIX: Import auth middleware

// ✅ FIX: All routes now require a valid JWT token
router.get('/', protect, getProducts);
router.post('/', protect, createProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
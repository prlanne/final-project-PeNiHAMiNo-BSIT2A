const express = require('express');
const router = express.Router();
const { logExpense, getExpenses } = require('../controllers/expenseController');
const protect = require('../middleware/authMiddleware'); // ✅ FIX: Import auth middleware

// ✅ FIX: All routes now require a valid JWT token
router.get('/', protect, getExpenses);
router.post('/', protect, logExpense);

module.exports = router;
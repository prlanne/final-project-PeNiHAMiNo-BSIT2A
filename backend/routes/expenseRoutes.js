const express = require('express');
const router = express.Router();
const { logExpense } = require('../controllers/expenseController');

router.post('/', logExpense);

module.exports = router;

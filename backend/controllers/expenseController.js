const Expense = require('../models/Expense');

const logExpense = async (req, res) => {
    try {
        const { category, amount } = req.body;
        const newExpense = new Expense({ category, amount });
        await newExpense.save();
        res.status(201).json({ message: 'Expense logged successfully', expense: newExpense });
    } catch (error) {
        res.status(500).json({ message: 'Error logging expense', error: error.message });
    }
};

module.exports = { logExpense };
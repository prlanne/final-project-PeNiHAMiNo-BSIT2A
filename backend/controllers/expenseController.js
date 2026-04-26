const Expense = require('../models/Expense');

const logExpense = async (req, res) => {
    try {
        const { category, amount } = req.body;

        // ✅ FIX: Associate the expense with the logged-in user
        const newExpense = new Expense({
            userId: req.user.id,
            category,
            amount
        });

        await newExpense.save();
        res.status(201).json({ message: 'Expense logged successfully', expense: newExpense });
    } catch (error) {
        res.status(500).json({ message: 'Error logging expense', error: error.message });
    }
};

const getExpenses = async (req, res) => {
    try {
        // If admin requests with ?userId=, return that user's expenses
        const targetUserId = (req.user.role === 'Admin' && req.query.userId) 
            ? req.query.userId 
            : req.user.id;
            
        const expenses = await Expense.find({ userId: targetUserId }).sort({ dateLogged: -1 });
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expenses', error: error.message });
    }
};
module.exports = { logExpense, getExpenses };
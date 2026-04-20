const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    // ✅ FIX: Every expense is now owned by a specific user
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    dateLogged: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);
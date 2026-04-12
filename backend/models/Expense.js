const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    dateLogged: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);
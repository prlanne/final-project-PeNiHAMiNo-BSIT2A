﻿const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Purchase = require('../models/Purchase');

const wipeUserData = async (req, res) => {
    try {
        const userId = req.user.id;
        
        await Promise.all([
            Product.deleteMany({ userId }),
            Sale.deleteMany({ userId }),
            Expense.deleteMany({ userId }),
            Purchase.deleteMany({ userId })
        ]);
        
        res.status(200).json({ 
            message: 'All user data wiped successfully'
        });
    } catch (error) {
        console.error('Wipe error:', error);
        res.status(500).json({ message: 'Error wiping data', error: error.message });
    }
};

module.exports = { wipeUserData };
const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    // ✅ FIX: Every sale is now owned by a specific user
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    total: { type: Number, required: true },
    saleDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sale', saleSchema);
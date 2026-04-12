const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    total: { type: Number, required: true }, // We will calculate this in the route
    saleDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sale', saleSchema);
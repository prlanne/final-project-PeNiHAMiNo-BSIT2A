const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        trim: true
    },
    supplierName: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitCost: {
        type: Number,
        required: true,
        min: 0
    },
    totalCost: {
        type: Number,
        required: true
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');

const getPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.find().sort({ purchaseDate: -1 });
        res.json(purchases);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const addPurchase = async (req, res) => {
    const { productName, supplierName, quantity, unitCost, totalCost, purchaseDate } = req.body;
    const purchase = new Purchase({ productName, supplierName, quantity, unitCost, totalCost, purchaseDate });

    try {
        const newPurchase = await purchase.save();
        const product = await Product.findOne({ name: productName });
        if (product) {
            product.stock += parseInt(quantity, 10);
            await product.save();
        }
        res.status(201).json(newPurchase);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = { getPurchases, addPurchase };
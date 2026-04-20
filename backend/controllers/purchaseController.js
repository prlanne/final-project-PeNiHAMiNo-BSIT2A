const Purchase = require('../models/Purchase');
const Product = require('../models/Product');

const getPurchases = async (req, res) => {
    try {
        // ✅ FIX: Only return purchases belonging to the logged-in user
        const purchases = await Purchase.find({ userId: req.user.id }).sort({ purchaseDate: -1 });
        res.json(purchases);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const addPurchase = async (req, res) => {
    const { productName, supplierName, quantity, unitCost, totalCost, purchaseDate } = req.body;

    // ✅ FIX: Save purchase with the logged-in user's ID
    const purchase = new Purchase({
        userId: req.user.id,
        productName,
        supplierName,
        quantity,
        unitCost,
        totalCost,
        purchaseDate
    });

    try {
        const newPurchase = await purchase.save();

        // ✅ FIX: Only update the product stock belonging to THIS user
        const product = await Product.findOne({
            name: productName,
            userId: req.user.id
        });

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
const Sale = require('../models/Sale');
const Product = require('../models/Product');

const recordSale = async (req, res) => {
    try {
        const { productName, quantity } = req.body;

        // ✅ FIX: Find product belonging to THIS user only
        const product = await Product.findOne({
            name: productName,
            userId: req.user.id
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        const total = product.price * quantity;
        product.stock -= quantity;
        await product.save();

        // ✅ FIX: Save the sale with the logged-in user's ID
        const newSale = new Sale({
            userId: req.user.id,
            productName,
            quantity,
            total
        });
        await newSale.save();

        res.status(201).json({ message: 'Sale recorded successfully', sale: newSale });
    } catch (error) {
        res.status(500).json({ message: 'Error recording sale', error: error.message });
    }
};

const getSales = async (req, res) => {
    try {
        // ✅ FIX: Only return sales belonging to the logged-in user
        const sales = await Sale.find({ userId: req.user.id }).sort({ saleDate: -1 });
        res.status(200).json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sales', error: error.message });
    }
};

module.exports = { recordSale, getSales };
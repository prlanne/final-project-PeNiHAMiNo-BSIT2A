const Sale = require('../models/Sale');
const Product = require('../models/Product');

const recordSale = async (req, res) => {
    try {
        const { productName, quantity } = req.body;
        const product = await Product.findOne({ name: productName });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        const total = product.price * quantity;
        product.stock -= quantity;
        await product.save();

        const newSale = new Sale({ productName, quantity, total });
        await newSale.save();

        res.status(201).json({ message: 'Sale recorded successfully', sale: newSale });
    } catch (error) {
        res.status(500).json({ message: 'Error recording sale', error: error.message });
    }
};

module.exports = { recordSale };
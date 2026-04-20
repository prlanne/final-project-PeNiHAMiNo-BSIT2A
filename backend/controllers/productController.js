const Product = require('../models/Product');

const createProduct = async (req, res) => {
    try {
        const { name, price, stock } = req.body;

        // ✅ FIX: Associate the new product with the logged-in user
        const newProduct = new Product({
            userId: req.user.id,
            name,
            price,
            stock
        });

        await newProduct.save();
        res.status(201).json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
        res.status(500).json({ message: 'Error adding product', error: error.message });
    }
};

const getProducts = async (req, res) => {
    try {
        // ✅ FIX: Only return products belonging to the logged-in user
        const products = await Product.find({ userId: req.user.id });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        // ✅ FIX: Only allow deleting own products (userId check prevents deleting others' data)
        const product = await Product.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found or not authorized' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};

module.exports = { createProduct, getProducts, deleteProduct };
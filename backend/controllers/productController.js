const Product = require('../models/Product');

const createProduct = async (req, res) => {
    try {
        const { name, price, stock } = req.body;
        const newProduct = new Product({ name, price, stock });
        await newProduct.save();
        res.status(201).json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
        res.status(500).json({ message: 'Error adding product', error: error.message });
    }
};

const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

module.exports = { createProduct, getProducts };
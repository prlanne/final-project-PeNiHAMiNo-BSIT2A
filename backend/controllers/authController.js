const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        //  Only search in Admin collection
        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.status(400).json({ msg: 'Invalid Admin Credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Admin Credentials' });
        }

        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ 
            token, 
            user: { id: admin._id, username: admin.username, role: admin.role } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { login };
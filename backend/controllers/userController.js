const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');  // ✅ ADD THIS

const register = async (req, res) => {
    try {
        const { username, email, password, full_name, role } = req.body;

        // Check both User and Admin collections for existing user
        const userExists = await User.findOne({ $or: [{ username }, { email }] });
        const adminExists = await Admin.findOne({ $or: [{ username }, { email }] });
        
        if (userExists || adminExists) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ✅ If role is Admin, save to Admin collection
        if (role === 'Admin') {
            const newAdmin = new Admin({
                username,
                email,
                password: hashedPassword,
                full_name,
                role: 'Admin'
            });

            await newAdmin.save();
            console.log(`✅ Admin registered: ${username}`);
            res.status(201).json({ msg: 'Admin registered successfully!' });
        } else {
            // Save to User collection for Seller/Buyer
            const newUser = new User({
                username,
                email,
                password: hashedPassword,
                full_name,
                role: role || 'Seller'
            });

            await newUser.save();
            console.log(`✅ User registered: ${username} as ${role || 'Seller'}`);
            res.status(201).json({ msg: 'User registered successfully!' });
        }
    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // ✅ Only search in User collection (Sellers/Buyers)
        let user = await User.findOne({ username });
        
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        // ✅ Block admins from logging in here
        if (user.role === 'Admin') {
            return res.status(400).json({ msg: 'Please use the Admin login page.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            token,
            user: { id: user._id, username: user.username, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const getUsers = async (req, res) => {
    try {
        // ✅ Fetch from both collections
        const users = await User.find().select('-password');
        const admins = await Admin.find().select('-password');
        
        // Combine both arrays
        const allUsers = [...admins, ...users];
        
        res.json(allUsers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { full_name, role, email } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { full_name, role, email } },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ msg: 'User updated successfully', user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({ msg: 'User deleted successfully', deletedUser: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { register, login, getUsers, updateUser, deleteUser };
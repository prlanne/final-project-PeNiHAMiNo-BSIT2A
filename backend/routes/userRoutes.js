const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');  // ✅ ADD THIS LINE
const {
    register,
    login,
    getUsers,
    updateUser,
    deleteUser
} = require('../controllers/userController');

router.post('/register', register);
router.post('/login', login);
router.get('/', protect, getUsers);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);
module.exports = router;
const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getUsers,
    updateUser,
    deleteUser
} = require('../controllers/userController');

router.post('/register', register);
router.post('/login', login);
router.get('/', getUsers);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;

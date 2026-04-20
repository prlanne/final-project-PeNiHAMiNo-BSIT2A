const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const dataController = require('../controllers/dataController');

router.delete('/wipe', protect, dataController.wipeUserData);

module.exports = router;

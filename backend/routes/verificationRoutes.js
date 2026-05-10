const express = require('express');
const router = express.Router();
const { sendVerificationCode, verifyCode } = require('../controllers/verificationController');

// POST /api/verify/send-code - Send verification code to email
router.post('/send-code', sendVerificationCode);

// POST /api/verify/check-code - Verify code and create account
router.post('/check-code', verifyCode);

module.exports = router;
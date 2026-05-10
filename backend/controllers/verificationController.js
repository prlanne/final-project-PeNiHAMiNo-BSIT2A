const nodemailer = require('nodemailer');
delete require.cache[require.resolve('../models/VerificationCode')];
const VerificationCode = require('../models/VerificationCode');
const User = require('../models/User');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const validateGmailAddress = (email) => {
    if (!email) {
        return { valid: false, msg: 'Email is required' };
    }
    const normalized = email.toLowerCase().trim();
    if (!/^[^\s@]+@gmail\.com$/.test(normalized)) {
        return { valid: false, msg: 'Please use a valid Gmail address (@gmail.com).' };
    }
    return { valid: true, email: normalized };
};

// Configure Gmail transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false // Allow self-signed certificates (for local/corporate networks)
    }
});

// Verify transporter connection
transporter.verify(function(error, success) {
    if (error) {
        console.error('❌ Gmail Transporter Error:', error);
        console.error('Make sure:');
        console.error('1. GMAIL_USER is set correctly in .env');
        console.error('2. GMAIL_APP_PASSWORD is a valid Google App Password (not your regular password)');
        console.error('3. You have 2FA enabled on your Google account');
    } else {
        console.log('✅ Gmail Transporter is ready to send emails');
    }
});

// Generate random 6-digit code
const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification code
const sendVerificationCode = async (req, res) => {
    try {
        const { email, username, full_name, password } = req.body;

        // Validate all fields are present
        if (!email || !username || !full_name || !password) {
            return res.status(400).json({ msg: 'All fields are required' });
        }

        // Validate Gmail address before any DB operations
        const validation = validateGmailAddress(email);
        if (!validation.valid) {
            return res.status(400).json({ msg: validation.msg });
        }

        const normalizedEmail = validation.email;
        const normalizedUsername = username?.trim();
        const normalizedFullName = full_name?.trim();

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ username: normalizedUsername }, { email: normalizedEmail }] });
        const existingAdmin = await Admin.findOne({ $or: [{ username: normalizedUsername }, { email: normalizedEmail }] });
        
        if (existingUser || existingAdmin) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Generate 6-digit code
        const code = generateCode();

        // Hash password before storing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Delete any existing verification codes for this email
        await VerificationCode.deleteMany({ email: normalizedEmail });

        // Save verification code with user data
        const verificationCode = new VerificationCode({
            email: normalizedEmail,
            code,
            username: normalizedUsername,
            full_name: normalizedFullName,
            password: hashedPassword
        });
        await verificationCode.save();

        // Send email with verification code
        const mailOptions = {
            from: `"BentaBoard" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: '🔐 BentaBoard - Email Verification Code',
            html: `
                <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%); border-radius: 20px;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h2 style="color: #00a8ff; margin: 0; font-size: 28px; font-weight: 700;">BentaBoard</h2>
                        <p style="color: #64748b; margin-top: 5px; font-size: 14px;">"From bawat benta to tunay na kita—track it right."</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
                        <h3 style="color: #0f172a; margin-bottom: 15px; font-size: 18px;">Verify Your Email Address</h3>
                        
                        <p style="color: #54657a; font-size: 14px; line-height: 1.6;">
                            Hi <strong>${full_name}</strong>,<br><br>
                            Thank you for signing up for BentaBoard! To complete your registration, please use the verification code below:
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #22c55e; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
                            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #16a34a;">${code}</span>
                        </div>
                        
                        <p style="color: #dc2626; font-size: 12px; font-weight: 500;">
                            ⚠️ This code will expire in <strong>10 minutes</strong>.
                        </p>
                        
                        <p style="color: #54657a; font-size: 12px; margin-top: 15px;">
                            If you didn't request this verification, please ignore this email.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <p style="color: #94a3b8; font-size: 11px;">© 2026 BentaBoard. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ 
            msg: 'Verification code sent successfully! Please check your Gmail inbox.',
            email: email 
        });

        console.log(`✅ Verification code sent to ${email}: ${code}`);

    } catch (err) {
        console.error('❌ Send verification error:', err);
        console.error('Error Message:', err.message);
        console.error('Error Code:', err.code);
        console.error('Gmail User:', process.env.GMAIL_USER);
        
        // Provide more specific error message
        let errorMsg = 'Failed to send verification code. Please try again.';
        
        if (err.message && err.message.includes('Invalid login')) {
            errorMsg = 'Gmail authentication failed. Check your GMAIL_APP_PASSWORD in .env';
        } else if (err.message && err.message.includes('getaddrinfo')) {
            errorMsg = 'Network error. Check your internet connection.';
        } else if (err.message && err.message.includes('SMTP')) {
            errorMsg = 'SMTP connection failed. Check Gmail settings.';
        }
        
        res.status(500).json({ msg: errorMsg });
    }
};

// Verify code and create account
const verifyCode = async (req, res) => {
    try {
        let { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ msg: 'Email and code are required' });
        }

        email = email.toLowerCase().trim();

        // Find verification code
        const verificationCode = await VerificationCode.findOne({ email, code });

        if (!verificationCode) {
            return res.status(400).json({ msg: 'Invalid or expired verification code' });
        }

        // Check if user already exists (in case they refreshed and tried again)
        const existingUser = await User.findOne({ 
            $or: [{ username: verificationCode.username }, { email: verificationCode.email }] 
        });
        const existingAdmin = await Admin.findOne({ 
            $or: [{ username: verificationCode.username }, { email: verificationCode.email }] 
        });
        
        if (existingUser || existingAdmin) {
            await VerificationCode.deleteMany({ email });
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create the user with verified status
        const newUser = new User({
            username: verificationCode.username,
            email: verificationCode.email,
            password: verificationCode.password,
            full_name: verificationCode.full_name,
            role: 'Seller',
            isVerified: true
        });

        await newUser.save();

        // Clean up verification code
        await VerificationCode.deleteMany({ email });

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        console.log(`✅ User registered and verified: ${verificationCode.username}`);

        res.status(201).json({
            msg: 'Email verified and account created successfully!',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                role: newUser.role
            }
        });

    } catch (err) {
        console.error('Verify code error:', err);
        res.status(500).json({ msg: 'Failed to verify code. Please try again.' });
    }
};

module.exports = { sendVerificationCode, verifyCode };
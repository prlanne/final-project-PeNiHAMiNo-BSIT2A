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

const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const getGmailAccessToken = async () => {
    const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;

    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
        throw new Error('Gmail OAuth credentials are not configured');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: GMAIL_CLIENT_ID,
            client_secret: GMAIL_CLIENT_SECRET,
            refresh_token: GMAIL_REFRESH_TOKEN,
            grant_type: 'refresh_token'
        })
    });

    const data = await response.json();

    if (!response.ok || !data.access_token) {
        throw new Error(`Gmail token refresh failed (${response.status}): ${JSON.stringify(data)}`);
    }

    return data.access_token;
};

const encodeBase64Url = (value) => {
    return Buffer.from(value)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
};

const buildVerificationEmail = ({ to, full_name, code }) => {
    const from = process.env.GMAIL_USER;

    if (!from) {
        throw new Error('GMAIL_USER is not configured');
    }

    const html = `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%); border-radius: 20px;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: #00a8ff; margin: 0; font-size: 28px; font-weight: 700;">BentaBoard</h2>
                <p style="color: #64748b; margin-top: 5px; font-size: 14px;">"From bawat benta to tunay na kita-track it right."</p>
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
                    This code will expire in <strong>10 minutes</strong>.
                </p>

                <p style="color: #54657a; font-size: 12px; margin-top: 15px;">
                    If you did not request this verification, please ignore this email.
                </p>
            </div>

            <div style="text-align: center; margin-top: 20px;">
                <p style="color: #94a3b8; font-size: 11px;">2026 BentaBoard. All rights reserved.</p>
            </div>
        </div>
    `;

    const message = [
        `From: BentaBoard <${from}>`,
        `To: ${to}`,
        'Subject: BentaBoard - Email Verification Code',
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        html
    ].join('\r\n');

    return encodeBase64Url(message);
};

const sendVerificationEmail = async ({ to, full_name, code }) => {
    const accessToken = await getGmailAccessToken();

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            raw: buildVerificationEmail({ to, full_name, code })
        })
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(`Gmail API send failed (${response.status}): ${details}`);
    }
};

const sendVerificationCode = async (req, res) => {
    try {
        const { email, username, full_name, password } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({ msg: 'All fields are required' });
        }

        const validation = validateGmailAddress(email);
        if (!validation.valid) {
            return res.status(400).json({ msg: validation.msg });
        }

        const normalizedEmail = validation.email;
        const normalizedUsername = username.trim();
        const normalizedFullName = full_name?.trim();

        const existingUser = await User.findOne({
            $or: [{ username: normalizedUsername }, { email: normalizedEmail }]
        });
        const existingAdmin = await Admin.findOne({
            $or: [{ username: normalizedUsername }, { email: normalizedEmail }]
        });

        if (existingAdmin || (existingUser && existingUser.isVerified)) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        if (!existingUser && !normalizedFullName) {
            return res.status(400).json({ msg: 'Full name is required' });
        }

        if (existingUser) {
            const passwordMatches = await bcrypt.compare(password, existingUser.password);

            if (!passwordMatches) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }
        }

        const code = generateCode();
        const hashedPassword = existingUser
            ? existingUser.password
            : await bcrypt.hash(password, await bcrypt.genSalt(10));
        const verificationName = existingUser ? existingUser.full_name : normalizedFullName;

        await VerificationCode.deleteMany({ email: normalizedEmail });

        const verificationCode = new VerificationCode({
            email: normalizedEmail,
            code,
            username: normalizedUsername,
            full_name: verificationName,
            password: hashedPassword
        });
        await verificationCode.save();

        await sendVerificationEmail({
            to: normalizedEmail,
            full_name: verificationName,
            code
        });

        res.status(200).json({
            msg: 'Verification code sent successfully! Please check your Gmail inbox.',
            email: normalizedEmail
        });

        console.log(`Verification code sent to ${normalizedEmail}`);
    } catch (err) {
        console.error('Send verification error:', err);

        let errorMsg = 'Failed to send verification code through Gmail API. Please try again.';

        if (err.message && err.message.includes('Gmail OAuth credentials')) {
            errorMsg = 'Gmail OAuth credentials are not configured.';
        } else if (err.message && err.message.includes('GMAIL_USER')) {
            errorMsg = 'Gmail sender email is not configured.';
        } else if (err.message && err.message.includes('token refresh failed')) {
            errorMsg = 'Gmail authentication failed. Check your client ID, client secret, and refresh token.';
        } else if (err.message && err.message.includes('403')) {
            errorMsg = 'Gmail API permission denied. Check Gmail API scopes and account access.';
        }

        res.status(500).json({ msg: errorMsg });
    }
};

const verifyCode = async (req, res) => {
    try {
        let { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ msg: 'Email and code are required' });
        }

        email = email.toLowerCase().trim();

        const verificationCode = await VerificationCode.findOne({ email, code });

        if (!verificationCode) {
            return res.status(400).json({ msg: 'Invalid or expired verification code' });
        }

        let existingUser = await User.findOne({
            $or: [{ username: verificationCode.username }, { email: verificationCode.email }]
        });
        const existingAdmin = await Admin.findOne({
            $or: [{ username: verificationCode.username }, { email: verificationCode.email }]
        });

        if (existingAdmin || (existingUser && existingUser.isVerified)) {
            await VerificationCode.deleteMany({ email });
            return res.status(400).json({ msg: 'User already exists' });
        }

        if (existingUser) {
            existingUser.isVerified = true;
            await existingUser.save();
        } else {
            existingUser = new User({
                username: verificationCode.username,
                email: verificationCode.email,
                password: verificationCode.password,
                full_name: verificationCode.full_name,
                role: 'Seller',
                isVerified: true
            });

            await existingUser.save();
        }

        await VerificationCode.deleteMany({ email });

        const token = jwt.sign(
            { id: existingUser._id, role: existingUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        console.log(`User registered and verified: ${verificationCode.username}`);

        res.status(201).json({
            msg: 'Email verified and account created successfully!',
            token,
            user: {
                id: existingUser._id,
                username: existingUser.username,
                role: existingUser.role
            }
        });
    } catch (err) {
        console.error('Verify code error:', err);
        res.status(500).json({ msg: 'Failed to verify code. Please try again.' });
    }
};

module.exports = { sendVerificationCode, verifyCode };

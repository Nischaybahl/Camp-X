const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campx')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.log('❌ MongoDB connection error:', err.message));

// ========================
// SCHEMAS
// ========================

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// OTP Schema for password reset
const otpSchema = new mongoose.Schema({
    email: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: 300 } // Auto-delete after 5 minutes (TTL index)
});
const OTP = mongoose.model('OTP', otpSchema);

// Generic Item Schema (complaints, attendance, notes)
const itemSchema = new mongoose.Schema({
    type: { type: String, required: true, index: true },
    data: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Item = mongoose.model('Item', itemSchema);

// Support Message Schema
const supportSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: String, required: true }
});
const SupportMessage = mongoose.model('SupportMessage', supportSchema);

// ========================
// GMAIL TRANSPORTER
// ========================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// In-memory rate limiter for OTP requests (IP + email based)
const otpRateLimiter = new Map();
const OTP_COOLDOWN_MS = 60000; // 60 seconds between OTP requests

function checkOtpRateLimit(key) {
    const now = Date.now();
    const lastRequest = otpRateLimiter.get(key);
    if (lastRequest && (now - lastRequest) < OTP_COOLDOWN_MS) {
        const remainingSec = Math.ceil((OTP_COOLDOWN_MS - (now - lastRequest)) / 1000);
        return { allowed: false, remainingSec };
    }
    otpRateLimiter.set(key, now);
    // Cleanup old entries every 100 entries
    if (otpRateLimiter.size > 100) {
        for (const [k, v] of otpRateLimiter.entries()) {
            if (now - v > OTP_COOLDOWN_MS * 5) otpRateLimiter.delete(k);
        }
    }
    return { allowed: true };
}

// Generate secure 6-digit OTP
function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

// Premium CampX OTP email template
function getOtpEmailTemplate(otp, userName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(145deg, #151515, #1a1a1a); border-radius: 20px; border: 1px solid #2a2a2a; overflow: hidden;">
                        
                        <!-- Header with gradient accent -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #222;">
                                <div style="font-size: 32px; font-weight: 800; letter-spacing: -1px;">
                                    <span style="color: #ffffff;">Camp</span><span style="color: #ccff00;">X</span>
                                </div>
                                <div style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px;">Password Recovery</div>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 8px;">
                                    Hi${userName ? ' ' + userName : ''},
                                </p>
                                <p style="color: #999; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                                    We received a request to reset your password. Use the verification code below to proceed.
                                </p>

                                <!-- OTP Box -->
                                <div style="background: linear-gradient(135deg, rgba(204,255,0,0.08), rgba(204,255,0,0.03)); border: 1px solid rgba(204,255,0,0.2); border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 30px;">
                                    <div style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 12px;">Verification Code</div>
                                    <div style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #ccff00; font-family: 'Courier New', monospace;">
                                        ${otp}
                                    </div>
                                    <div style="color: #666; font-size: 13px; margin-top: 12px;">
                                        ⏱ Expires in <strong style="color: #ff6b6b;">5 minutes</strong>
                                    </div>
                                </div>

                                <!-- Security Notice -->
                                <div style="background: rgba(255,59,48,0.06); border: 1px solid rgba(255,59,48,0.15); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                                    <p style="color: #ff6b6b; font-size: 13px; margin: 0; line-height: 1.5;">
                                        🔒 <strong>Security Notice:</strong> If you did not request this code, please ignore this email. Never share this code with anyone.
                                    </p>
                                </div>

                                <p style="color: #666; font-size: 13px; line-height: 1.6; margin: 0;">
                                    You have a maximum of <strong style="color: #ccc;">3 attempts</strong> to enter the correct code. After that, you'll need to request a new one.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="border-top: 1px solid #222; padding: 24px 40px; text-align: center;">
                                <p style="color: #444; font-size: 12px; margin: 0; line-height: 1.6;">
                                    &copy; ${new Date().getFullYear()} CampX &bull; Where technology meets the future of campus life.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

// ========================
// HEALTH CHECK
// ========================
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'CampX API is running' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', dbState: mongoose.connection.readyState });
});

// ========================
// USER AUTH ROUTES
// ========================

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const user = new User({
            name,
            email: email.toLowerCase(),
            password,
            verified: true,
            isAdmin: email.toLowerCase() === 'en23cs301682@medicaps.ac.in'
        });
        await user.save();
        res.status(201).json({ message: 'Account created successfully', user: { name: user.name, email: user.email, verified: user.verified, isAdmin: user.isAdmin } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Admin hardcoded login
        if (email.toLowerCase() === 'en23cs301682@medicaps.ac.in' && password === 'Admin07') {
            return res.json({
                user: { email: 'en23cs301682@medicaps.ac.in', name: 'Admin User', verified: true, isAdmin: true }
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        let isMatch = false;
        // Check if stored password is a bcrypt hash (starts with $2a$ or $2b$)
        if (user.password.startsWith('$2')) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            // Fallback to plain text check for older users
            isMatch = (password === user.password);
        }

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        res.json({
            user: { name: user.name, email: user.email, verified: user.verified, isAdmin: user.isAdmin }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================
// OTP-BASED FORGOT PASSWORD
// ========================

// POST /api/auth/forgot-password — Send OTP to registered email
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        const normalizedEmail = email.toLowerCase();

        // Rate limiting: one OTP per email per 60 seconds
        const rateCheck = checkOtpRateLimit(normalizedEmail);
        if (!rateCheck.allowed) {
            return res.status(429).json({ 
                error: `Please wait ${rateCheck.remainingSec} seconds before requesting another OTP.`,
                retryAfter: rateCheck.remainingSec
            });
        }

        // Check if user exists
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            // Security: don't reveal whether email exists, but return success-like response
            return res.json({ message: 'If the email is registered, an OTP has been sent.' });
        }

        // Delete any existing OTPs for this email
        await OTP.deleteMany({ email: normalizedEmail });

        // Generate and store OTP
        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        await new OTP({
            email: normalizedEmail,
            otp: hashedOtp,
            attempts: 0,
            verified: false
        }).save();

        // Send OTP email via Gmail
        const mailOptions = {
            from: `"CampX Support" <${process.env.GMAIL_USER}>`,
            to: user.email,
            subject: '🔐 Your CampX Password Reset Code',
            html: getOtpEmailTemplate(otp, user.name)
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP sent to ${normalizedEmail}`);

        res.json({ message: 'If the email is registered, an OTP has been sent.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Failed to process request. Please try again.' });
    }
});

// POST /api/auth/verify-otp — Verify the 6-digit OTP
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required.' });
        }

        const normalizedEmail = email.toLowerCase();

        // Find the OTP record
        const otpRecord = await OTP.findOne({ email: normalizedEmail });
        if (!otpRecord) {
            return res.status(400).json({ error: 'OTP has expired or was not requested. Please request a new one.' });
        }

        // Check max attempts (3 wrong attempts allowed)
        if (otpRecord.attempts >= 3) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(429).json({ error: 'Too many wrong attempts. Please request a new OTP.' });
        }

        // Verify OTP using bcrypt
        const isValid = await bcrypt.compare(otp, otpRecord.otp);
        if (!isValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            const remaining = 3 - otpRecord.attempts;
            return res.status(400).json({ 
                error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
            });
        }

        // Mark OTP as verified (will be checked during password reset)
        otpRecord.verified = true;
        await otpRecord.save();

        res.json({ message: 'OTP verified successfully. You can now reset your password.' });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({ error: 'Failed to verify OTP.' });
    }
});

// POST /api/auth/reset-password — Reset password after OTP verification
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and new password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        const normalizedEmail = email.toLowerCase();

        // Verify that OTP was confirmed for this email
        const otpRecord = await OTP.findOne({ email: normalizedEmail, verified: true });
        if (!otpRecord) {
            return res.status(403).json({ error: 'OTP verification required before resetting password.' });
        }

        // Find the user
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Hash new password using bcrypt
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Clean up: delete the OTP record
        await OTP.deleteMany({ email: normalizedEmail });

        console.log(`✅ Password reset for ${normalizedEmail}`);
        res.json({ message: 'Password has been successfully updated!' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Failed to reset password.' });
    }
});

// Keep old token-based reset route for backward compatibility
app.post('/api/auth/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
        }

        // Hash new password using bcrypt
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: 'Password has been successfully updated.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Failed to reset password.' });
    }
});

// Get all users (admin only)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, 'name email verified isAdmin createdAt').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================
// GENERIC CRUD API (complaints, attendance, notes)
// ========================

// Get items by type
app.get('/api/items/:type', async (req, res) => {
    try {
        const items = await Item.find({ type: req.params.type }).sort({ createdAt: -1 });
        res.json(items.map(i => ({ id: i._id, ...i.data })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create item
app.post('/api/items/:type', async (req, res) => {
    try {
        const item = new Item({ type: req.params.type, data: req.body });
        await item.save();
        res.status(201).json({ id: item._id, ...item.data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update item
app.put('/api/items/:type/:id', async (req, res) => {
    try {
        const item = await Item.findOneAndUpdate(
            { _id: req.params.id, type: req.params.type },
            { data: req.body },
            { new: true }
        );
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json({ id: item._id, ...item.data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete item
app.delete('/api/items/:type/:id', async (req, res) => {
    try {
        await Item.findOneAndDelete({ _id: req.params.id, type: req.params.type });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================
// SUPPORT MESSAGES
// ========================

// Get all support messages
app.get('/api/support', async (req, res) => {
    try {
        const messages = await SupportMessage.find().sort({ timestamp: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create support message
app.post('/api/support', async (req, res) => {
    try {
        const { name, email, message, timestamp } = req.body;
        const msg = new SupportMessage({ name, email, message, timestamp });
        await msg.save();
        res.status(201).json(msg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete support message
app.delete('/api/support/:id', async (req, res) => {
    try {
        await SupportMessage.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================
// START SERVER
// ========================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

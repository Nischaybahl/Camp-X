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

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        // Clean expired tokens in the background
        User.updateMany(
            { resetPasswordExpires: { $lt: Date.now() } },
            { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } }
        ).catch(err => console.error('Failed to clean expired tokens:', err));

        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        // Security requirement: do not reveal whether user exists
        if (!user) {
            return res.json({ message: 'If the email exists, a reset link will be sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransport({
            host: 'smtp-relay.brevo.com',
            port: 587,
            secure: false, // TLS requires secure: false for port 587
            auth: {
                user: process.env.BREVO_SMTP_USER,
                pass: process.env.BREVO_SMTP_PASS
            }
        });

        const mailOptions = {
            from: process.env.BREVO_SMTP_USER || 'no-reply@campx.com',
            to: user.email,
            subject: 'Reset Your Campx Password',
            html: `
                <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #0d0d0d; color: #f5f5f5; border-radius: 12px; border: 1px solid #333;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #a8e600; font-size: 28px; margin: 0;">CampX</h1>
                    </div>
                    <h2 style="color: #ffffff; font-size: 22px; text-align: center;">Reset Your Password</h2>
                    <p style="font-size: 16px; line-height: 1.5; color: #cccccc; text-align: center;">You recently requested a password reset for your CampX account.</p>
                    <p style="font-size: 16px; line-height: 1.5; color: #cccccc; text-align: center;">Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${resetUrl}" style="background-color: #a8e600; color: #000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="font-size: 14px; line-height: 1.5; color: #999; text-align: center;">If you did not request this password reset, please ignore this email or contact support if you have questions.</p>
                    <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #666; text-align: center;">&copy; ${new Date().getFullYear()} CampX. All rights reserved.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'If the email exists, a reset link will be sent.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Failed to process request.' });
    }
});

// Reset Password
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

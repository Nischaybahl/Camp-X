const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

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

        const user = await User.findOne({ email: email.toLowerCase(), password });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        res.json({
            user: { name: user.name, email: user.email, verified: user.verified, isAdmin: user.isAdmin }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
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

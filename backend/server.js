const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campx')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// ========================
// BREVO EMAIL INTEGRATION
// ========================
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const brevoApiKey = process.env.BREVO_API_KEY;
        const targetEmail = process.env.SUPPORT_EMAIL || 'nischay.bahl.11681@gmail.com';
        
        if (!brevoApiKey) {
            console.warn('BREVO_API_KEY is not configured.');
            return res.status(500).json({ error: 'Email service not configured on server.' });
        }

        const data = {
            sender: { name, email },
            to: [{ email: targetEmail }],
            subject: `New CampX Support Message from ${name}`,
            textContent: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
        };

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
            headers: {
                'api-key': brevoApiKey,
                'Content-Type': 'application/json'
            }
        });

        res.status(200).json({ message: 'Email sent successfully', data: response.data });
    } catch (error) {
        console.error('Brevo API Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to send email.' });
    }
});

// ========================
// GENERIC CRUD API FOR FEATURES
// ========================
// We use a generic model to store features like Complaints, LostFound, Notes, etc.
const genericSchema = new mongoose.Schema({
    type: { type: String, required: true }, // e.g., 'complaint', 'lostfound', 'note'
    data: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Item = mongoose.model('Item', genericSchema);

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

// Update item (assuming id is passed)
app.put('/api/items/:type/:id', async (req, res) => {
    try {
        const item = await Item.findOneAndUpdate(
            { _id: req.params.id, type: req.params.type },
            { data: req.body },
            { new: true }
        );
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


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

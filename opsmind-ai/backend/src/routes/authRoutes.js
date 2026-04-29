const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register user
router.post('/signup', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        const user = new User({ name, email, password });
        await user.save();

        res.status(201).json({ 
            message: 'User created successfully',
            user: { name: user.name, email: user.email, apiKey: user.apiKey }
        });
    } catch (error) {
        next(error);
    }
});

// Login user
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        res.json({ 
            message: 'Login successful',
            user: { name: user.name, email: user.email, apiKey: user.apiKey }
        });
    } catch (error) {
        next(error);
    }
});

// Update profile
router.put('/profile', async (req, res, next) => {
    try {
        const { email, name, oldPassword, newPassword, apiKey } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required to identify user' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (name) user.name = name;
        
        if (newPassword) {
            if (!oldPassword) {
                return res.status(400).json({ error: 'Old password is required to set a new password' });
            }
            const isMatch = await user.comparePassword(oldPassword);
            if (!isMatch) {
                return res.status(401).json({ error: 'Incorrect old password' });
            }
            user.password = newPassword; // Will be hashed by pre-save hook
        }
        
        if (apiKey !== undefined) user.apiKey = apiKey;

        await user.save();

        res.json({ 
            message: 'Profile updated',
            user: { name: user.name, email: user.email, apiKey: user.apiKey }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

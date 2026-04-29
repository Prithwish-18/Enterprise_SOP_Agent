const express = require('express');
const router = express.Router();
const ChatSession = require('../models/ChatSession');

// Get all sessions for a user
router.get('/sessions', async (req, res, next) => {
    try {
        const email = req.query.email;
        if (!email) return res.status(400).json({ error: 'Email required' });
        
        const sessions = await ChatSession.find({ userId: email }).sort({ updatedAt: -1 });
        res.json(sessions);
    } catch (error) {
        next(error);
    }
});

// Create new session
router.post('/sessions', async (req, res, next) => {
    try {
        const { email, title } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const session = new ChatSession({ userId: email, title: title || 'New Chat', messages: [] });
        await session.save();
        res.status(201).json(session);
    } catch (error) {
        next(error);
    }
});

// Update session (add message or rename)
router.put('/sessions/:id', async (req, res, next) => {
    try {
        const { messages, title } = req.body;
        const updateData = {};
        if (messages) updateData.messages = messages;
        if (title) updateData.title = title;

        const session = await ChatSession.findByIdAndUpdate(
            req.params.id, 
            updateData,
            { new: true }
        );
        
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json(session);
    } catch (error) {
        next(error);
    }
});

// Delete a session
router.delete('/sessions/:id', async (req, res, next) => {
    try {
        const session = await ChatSession.findByIdAndDelete(req.params.id);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json({ message: 'Session deleted' });
    } catch (error) {
        next(error);
    }
});

// Clear all sessions for a user
router.delete('/sessions', async (req, res, next) => {
    try {
        const email = req.query.email;
        if (!email) return res.status(400).json({ error: 'Email required' });
        
        await ChatSession.deleteMany({ userId: email });
        res.json({ message: 'All sessions deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

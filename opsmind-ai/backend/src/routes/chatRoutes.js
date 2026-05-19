const express = require('express');
const router = express.Router();
const ChatSession = require('../models/ChatSession');
const { protect } = require('../middleware/authMiddleware');
const { cleanupOldData } = require('../utils/cleanup');

// Public endpoint to retrieve a shared chat session (no auth required)
router.get('/sessions/share/:id', async (req, res, next) => {
    try {
        const session = await ChatSession.findById(req.params.id);
        if (!session) return res.status(404).json({ error: 'Shared session not found' });
        res.json(session);
    } catch (error) {
        next(error);
    }
});

// All session routes are protected — identity comes from JWT
router.get('/sessions', protect, async (req, res, next) => {
    try {
        // Automatically wipe data older than 30 days dynamically
        await cleanupOldData(req.user.email);
        
        const sessions = await ChatSession.find({ userId: req.user.email }).sort({ updatedAt: -1 });
        res.json(sessions);
    } catch (error) {
        next(error);
    }
});

router.post('/sessions', protect, async (req, res, next) => {
    try {
        const { title } = req.body;
        const session = new ChatSession({ 
            userId: req.user.email, 
            title: title || 'New Chat', 
            messages: [] 
        });
        await session.save();
        res.status(201).json(session);
    } catch (error) {
        next(error);
    }
});

// Ownership check: session must belong to the requesting user
router.put('/sessions/:id', protect, async (req, res, next) => {
    try {
        const { messages, title } = req.body;
        const updateData = {};
        if (messages) updateData.messages = messages;
        if (title) updateData.title = title;

        const session = await ChatSession.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.email },
            updateData,
            { new: true }
        );
        
        if (!session) return res.status(404).json({ error: 'Session not found or access denied' });
        res.json(session);
    } catch (error) {
        next(error);
    }
});

router.delete('/sessions/:id', protect, async (req, res, next) => {
    try {
        const session = await ChatSession.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.user.email 
        });
        if (!session) return res.status(404).json({ error: 'Session not found or access denied' });
        res.json({ message: 'Session deleted' });
    } catch (error) {
        next(error);
    }
});

router.delete('/sessions', protect, async (req, res, next) => {
    try {
        await ChatSession.deleteMany({ userId: req.user.email });
        res.json({ message: 'All sessions deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

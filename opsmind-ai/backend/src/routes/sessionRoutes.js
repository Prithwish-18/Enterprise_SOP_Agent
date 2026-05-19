const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { protect } = require('../middleware/authMiddleware');
const UserSession = require('../models/UserSession');

/**
 * POST /api/auth/sessions/heartbeat
 * Called by frontend every 30s to register/refresh this device.
 * Body: { os, browser, deviceType }
 * Identifies the session by the first 16 chars of the JWT (unique per login).
 */
router.post('/sessions/heartbeat', protect, async (req, res, next) => {
    try {
        const { os = 'Unknown', browser = 'Unknown', deviceType = 'PC' } = req.body;

        // Derive a stable session token from the raw JWT (first 32 chars after "Bearer ")
        const rawToken = (req.headers.authorization || '').replace('Bearer ', '');
        const sessionToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        let clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || req.ip || '';
        if (clientIp === '::1') clientIp = '127.0.0.1';

        // Upsert: update lastSeen if exists, create if not
        await UserSession.findOneAndUpdate(
            { sessionToken },
            {
                userId: req.user._id,
                sessionToken,
                os,
                browser,
                deviceType,
                ip: clientIp,
                lastSeen: new Date(),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ ok: true });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/auth/sessions
 * Returns all active sessions for the logged-in user.
 * Sessions not pinged in the last 5 minutes are marked as offline.
 */
router.get('/sessions', protect, async (req, res, next) => {
    try {
        const sessions = await UserSession.find({ userId: req.user._id }).sort({ lastSeen: -1 });

        const rawToken = (req.headers.authorization || '').replace('Bearer ', '');
        const currentToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const mapped = sessions.map(s => ({
            id: s._id,
            os: s.os,
            browser: s.browser,
            deviceType: s.deviceType,
            ip: s.ip,
            lastSeen: s.lastSeen,
            isCurrent: s.sessionToken === currentToken,
            isOnline: s.lastSeen >= fiveMinutesAgo,
        }));

        const seenDevices = new Set();
        const result = [];

        for (const item of mapped) {
            const key = `${item.os.toLowerCase()}-${item.browser.toLowerCase()}-${item.deviceType.toLowerCase()}`;
            if (item.isCurrent || !seenDevices.has(key)) {
                result.push(item);
                seenDevices.add(key);
            }
        }

        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.delete('/sessions/:id', protect, async (req, res, next) => {
    try {
        await UserSession.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ ok: true });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

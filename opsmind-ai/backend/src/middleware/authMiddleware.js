const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Middleware to protect routes.
 * Verifies the JWT from the Authorization header and attaches
 * the authenticated user to req.user.
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized. Please log in.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Attach user to request, excluding password
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ error: 'Not authorized, user account not found.' });
        }
        next();
    } catch (error) {
        logger.warn(`Auth token rejection: ${error.message}`);
        return res.status(401).json({ error: 'Not authorized, invalid or expired token. Please log in again.' });
    }
};

module.exports = { protect };

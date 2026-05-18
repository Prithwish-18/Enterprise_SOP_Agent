const mongoose = require('mongoose');

/**
 * Tracks active login sessions per user.
 * Created/updated on every heartbeat ping from the frontend.
 * Expired sessions (no heartbeat for >5 min) are considered offline.
 */
const userSessionSchema = new mongoose.Schema({
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionToken: { type: String, required: true, unique: true }, // hashed JWT prefix so same browser tab doesn't dupe
    os:         { type: String, default: 'Unknown' },
    browser:    { type: String, default: 'Unknown' },
    deviceType: { type: String, default: 'PC' },
    ip:         { type: String, default: '' },
    lastSeen:   { type: Date, default: Date.now },
}, { timestamps: true });

// TTL index: automatically removes docs where lastSeen is older than 24 hours
userSessionSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('UserSession', userSessionSchema);

const app = require('../src/app');
const connectDB = require('../src/config/db');
const logger = require('../src/utils/logger');

// Cache database connection
let isConnected = false;

module.exports = async (req, res) => {
    if (!isConnected) {
        try {
            await connectDB();
            isConnected = true;
        } catch (err) {
            logger.error('Vercel: Failed to connect to database', err);
            return res.status(500).json({ error: 'Database connection failed' });
        }
    }
    
    // Handle the request using the Express app
    return app(req, res);
};

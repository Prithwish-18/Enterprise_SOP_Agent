require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB().then(() => {
    app.listen(PORT, () => {
        logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
}).catch(err => {
    logger.error('Failed to connect to database', err);
    process.exit(1);
});

// trigger restart

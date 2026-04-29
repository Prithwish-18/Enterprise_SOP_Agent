const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorMiddleware');
const adminRoutes = require('./routes/adminRoutes');
const queryRoutes = require('./routes/queryRoutes');
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

// Serve uploaded files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'OpsMind AI API is running' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;

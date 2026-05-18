const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorMiddleware');
const adminRoutes = require('./routes/adminRoutes');
const queryRoutes = require('./routes/queryRoutes');
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();

app.use(helmet());

// Restrict CORS to the deployed frontend only
const allowedOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : []),
    'https://ai-opsmind.vercel.app',
    'https://ai-opsmind.netlify.app',
    'http://localhost:5173',
    'http://localhost:4173',
].filter(Boolean).map(url => url.trim().replace(/\/$/, ''));

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, Postman in dev, or same-origin)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Allow local network testing (e.g., from a mobile phone on Wi-Fi)
        if (origin.match(/^http:\/\/192\.168\.\d+\.\d+:\d+$/) || origin.match(/^http:\/\/10\.\d+\.\d+\.\d+:\d+$/)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS policy: origin '${origin}' is not allowed.`));
    },
    credentials: true,
}));

// Rate limiting — auth brute-force protection
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting — AI query / upload cost protection
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Generous limiter for heartbeat pings (every 30s per client)
const heartbeatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 pings per 15min ≈ one every ~4.5s — way more than needed
    message: { error: 'Too many heartbeat requests.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/auth/sessions/heartbeat', heartbeatLimiter); // generous limiter for 30s pings
app.use('/api/auth', apiLimiter, sessionRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/query', apiLimiter, queryRoutes);
app.use('/api/chat', chatRoutes);


// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'OpsMind AI API is running' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;

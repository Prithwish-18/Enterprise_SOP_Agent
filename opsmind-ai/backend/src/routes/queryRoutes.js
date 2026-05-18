const express = require('express');
const { streamQuery } = require('../controllers/queryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected — user identity comes from JWT
router.post('/stream', protect, streamQuery);

module.exports = router;

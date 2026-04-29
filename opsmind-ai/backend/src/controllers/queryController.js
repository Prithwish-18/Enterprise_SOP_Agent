const { generateRAGResponse } = require('../services/ragService');
const logger = require('../utils/logger');

const streamQuery = async (req, res) => {
    const { query, email } = req.body;
    
    // Resolve API key: ignore placeholder values and empty strings
    let apiKey = req.headers['x-gemini-api-key'];
    if (!apiKey || apiKey === '__USE_SERVER_KEY__' || apiKey.trim() === '') {
        apiKey = process.env.GEMINI_API_KEY;
    }

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    if (!apiKey) {
        return res.status(400).json({ error: 'No Gemini API key available. Please configure GEMINI_API_KEY on the server or provide one in Settings.' });
    }

    // Setup SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const onChunk = (textChunk) => {
        res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
    };

    try {
        await generateRAGResponse(query, apiKey, onChunk, email);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    } catch (error) {
        logger.error(`Query Stream Error: ${error.message}`);
        
        // Send a user-friendly error via SSE instead of generic message
        let errorMsg = 'An unexpected error occurred. Please try again.';
        
        if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
            errorMsg = '⏳ API rate limit reached. The free tier quota has been exceeded. Please wait a few minutes and try again, or provide your own Gemini API key for uninterrupted access.';
        } else if (error.message?.includes('API key')) {
            errorMsg = '🔑 Invalid API key. Please check your Gemini API key in Settings.';
        }
        
        res.write(`data: ${JSON.stringify({ text: errorMsg })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    }
};

module.exports = { streamQuery };

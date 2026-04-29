const { GoogleGenAI } = require('@google/genai');

/**
 * Create a GoogleGenAI instance with the given API key.
 * Services should call this with the user-provided key (or env fallback).
 */
const createAIClient = (apiKey) => {
    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
    if (!effectiveKey) {
        throw new Error('No Gemini API key available');
    }
    return new GoogleGenAI({ apiKey: effectiveKey });
};

module.exports = { createAIClient };

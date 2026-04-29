const { GoogleGenAI } = require('@google/genai');
const logger = require('../utils/logger');

const EMBEDDING_MODEL = 'text-embedding-004';

/**
 * Generate a vector embedding for the given text.
 * Uses Google's text-embedding-004 model via the @google/genai SDK.
 *
 * @param {string} text - The text to embed
 * @param {string} [apiKey] - Optional user-provided API key (falls back to env)
 * @param {string} [taskType] - Optional task type: RETRIEVAL_DOCUMENT, RETRIEVAL_QUERY, SEMANTIC_SIMILARITY
 * @returns {number[]|null} The embedding vector, or null on failure
 */
const generateEmbedding = async (text, apiKey, taskType = 'RETRIEVAL_DOCUMENT') => {
    try {
        if (!text || text.trim().length === 0) {
            logger.warn('generateEmbedding called with empty text');
            return null;
        }

        const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
        if (!effectiveKey) {
            logger.error('No API key available for embedding generation');
            return null;
        }

        const ai = new GoogleGenAI({ apiKey: effectiveKey });

        const result = await ai.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: {
                role: 'user',
                parts: [{ text: text.slice(0, 8000) }], 
            },
            config: {
                taskType: taskType,
            },
        });

        if (result?.embedding?.values && result.embedding.values.length > 0) {
            return result.embedding.values;
        }

        logger.warn('Embedding result was empty or malformed');
        return null;

    } catch (error) {
        const msg = error.message || '';
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
            logger.warn(`Embedding rate limited: ${msg}`);
        } else if (msg.includes('404') || msg.includes('NOT_FOUND')) {
            logger.error(`Embedding model not found: ${msg}`);
        } else {
            logger.error(`Embedding generation failed: ${msg}`);
        }
        return null;
    }
};

/**
 * Generate an embedding optimized for query retrieval.
 * Uses RETRIEVAL_QUERY task type for better search quality.
 */
const generateQueryEmbedding = async (text, apiKey) => {
    return generateEmbedding(text, apiKey, 'RETRIEVAL_QUERY');
};

module.exports = { generateEmbedding, generateQueryEmbedding };
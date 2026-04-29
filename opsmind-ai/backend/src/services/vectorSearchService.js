const Chunk = require('../models/Chunk');
const Document = require('../models/Document');
const { generateQueryEmbedding } = require('./embeddingService');
const { SEARCH_LIMIT } = require('../config/vector');
const logger = require('../utils/logger');

/**
 * Cosine similarity between two vectors
 */
const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    if (normA === 0 || normB === 0) return 0;
    return dot / (normA * normB);
};

/**
 * Keyword-based search fallback (TF-IDF style) — works WITHOUT embeddings
 */
const keywordSearch = async (queryText, userId) => {
    logger.info('Using keyword-based fallback search (no embeddings needed)');
    
    const query = userId ? { userId } : {};
    const allChunks = await Chunk.find(query).lean();
    if (!allChunks || allChunks.length === 0) return [];

    // Tokenize query into keywords
    const queryWords = queryText.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2); // Skip tiny words

    // Score each chunk by keyword match density
    const scored = allChunks.map(chunk => {
        const text = (chunk.text || '').toLowerCase();
        let score = 0;
        
        for (const word of queryWords) {
            const regex = new RegExp(word, 'gi');
            const matches = text.match(regex);
            if (matches) {
                score += matches.length;
            }
        }
        
        // Normalize by text length to favor density
        const normalizedScore = text.length > 0 ? score / Math.sqrt(text.length) : 0;
        
        return { ...chunk, score: normalizedScore };
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, SEARCH_LIMIT);

    // Lookup document names
    const docIds = [...new Set(scored.map(c => c.documentId.toString()))];
    const docs = await Document.find({ _id: { $in: docIds } }).lean();
    const docMap = {};
    docs.forEach(d => { docMap[d._id.toString()] = d.originalName; });

    return scored.map(c => ({
        text: c.text,
        page: c.page,
        section: c.section,
        score: c.score,
        documentName: docMap[c.documentId.toString()] || 'Unknown'
    }));
};

/**
 * Vector similarity search with keyword fallback
 */
const fallbackVectorSearch = async (queryEmbedding, userId) => {
    logger.info('Using in-memory cosine similarity search');
    
    const query = userId ? { userId } : {};
    const allChunks = await Chunk.find(query).lean();
    if (!allChunks || allChunks.length === 0) return [];

    const scored = allChunks
        .filter(c => c.embedding && c.embedding.length > 0)
        .map(chunk => ({
            ...chunk,
            score: cosineSimilarity(queryEmbedding, chunk.embedding)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, SEARCH_LIMIT);

    const docIds = [...new Set(scored.map(c => c.documentId.toString()))];
    const docs = await Document.find({ _id: { $in: docIds } }).lean();
    const docMap = {};
    docs.forEach(d => { docMap[d._id.toString()] = d.originalName; });

    return scored.map(c => ({
        text: c.text,
        page: c.page,
        section: c.section,
        score: c.score,
        documentName: docMap[c.documentId.toString()] || 'Unknown'
    }));
};

const searchRelevantChunks = async (queryText, apiKey, userId) => {
    try {
        // Try to generate query embedding
        const queryEmbedding = await generateQueryEmbedding(queryText, apiKey);
        
        if (!queryEmbedding) {
            // Embeddings unavailable — use keyword search
            logger.warn('Embedding generation failed. Falling back to keyword search.');
            return await keywordSearch(queryText, userId);
        }

        // Try Atlas Vector Search first
        try {
            const results = await Chunk.aggregate([
                {
                    "$vectorSearch": {
                        "index": "vector_index",
                        "path": "embedding",
                        "queryVector": queryEmbedding,
                        "numCandidates": 100,
                        "limit": SEARCH_LIMIT,
                        "filter": userId ? { "userId": userId } : undefined
                    }
                },
                {
                    "$lookup": {
                        "from": "documents",
                        "localField": "documentId",
                        "foreignField": "_id",
                        "as": "document"
                    }
                },
                { "$unwind": "$document" },
                {
                    "$project": {
                        "_id": 0, "text": 1, "page": 1, "section": 1,
                        "score": { "$meta": "vectorSearchScore" },
                        "documentName": "$document.originalName"
                    }
                }
            ]);

            if (results && results.length > 0) {
                logger.info(`Atlas Vector Search: ${results.length} results`);
                return results;
            }
        } catch (atlasError) {
            logger.warn(`Atlas unavailable: ${atlasError.message}. Using fallback.`);
        }

        // In-memory vector search
        return await fallbackVectorSearch(queryEmbedding, userId);

    } catch (error) {
        logger.error(`Vector search error: ${error.message}`);
        // Last resort — keyword search
        logger.info('All vector search methods failed. Trying keyword search...');
        return await keywordSearch(queryText, userId);
    }
};

module.exports = { searchRelevantChunks };

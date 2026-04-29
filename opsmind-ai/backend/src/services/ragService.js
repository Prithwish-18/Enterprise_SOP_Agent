const { searchRelevantChunks } = require('./vectorSearchService');
const { GoogleGenAI } = require('@google/genai');
const logger = require('../utils/logger');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Valid models only — no gemini-1.5-flash (404s on current API).
 * Sequential attempts: try each model up to MAX_RETRIES before moving on.
 */
const VALID_MODELS = ['gemini-flash-latest'];
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000; // 5 seconds between retries (not 50+)

/**
 * Try streaming generation with clean sequential retry logic.
 * - Max 2 attempts per model
 * - On quota/rate-limit: wait 5s then retry once, then move to next model
 * - On non-retryable error: throw immediately
 */
const generateWithRetry = async (ai, prompt) => {
    let lastError = null;

    for (const model of VALID_MODELS) {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                logger.info(`Generating with ${model} (attempt ${attempt}/${MAX_RETRIES})`);

                const result = await ai.models.generateContentStream({
                    model: model,
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: prompt }],
                        }
                    ],
                    config: {
                        temperature: 0.3,
                        topP: 0.9,
                        maxOutputTokens: 4096,
                    },
                });

                return result; // Success — return the stream

            } catch (error) {
                lastError = error;
                const msg = error.message || '';
                const isRateLimit = msg.includes('429') ||
                                    msg.includes('RESOURCE_EXHAUSTED') ||
                                    msg.includes('quota');
                const isNotFound = msg.includes('404') || msg.includes('NOT_FOUND');

                // Model doesn't exist — skip it entirely, don't retry
                if (isNotFound) {
                    logger.warn(`Model ${model} not available (404). Skipping.`);
                    break;
                }

                // Rate limited — retry once after short delay, then move on
                if (isRateLimit) {
                    if (attempt < MAX_RETRIES) {
                        logger.warn(`Rate limited on ${model}. Waiting ${RETRY_DELAY_MS}ms...`);
                        await sleep(RETRY_DELAY_MS);
                        continue;
                    } else {
                        logger.warn(`${model} rate limited after ${MAX_RETRIES} attempts. Trying next model.`);
                        break;
                    }
                }

                // Other error — don't retry, throw immediately
                throw error;
            }
        }
    }

    // All models exhausted
    throw lastError || new Error('All models failed. Please try again later.');
};

const generateRAGResponse = async (queryText, apiKey, onChunk, userId) => {
    try {
        const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;

        if (!effectiveApiKey) {
            onChunk("⚠️ No Gemini API key configured. Please provide one in Settings or set GEMINI_API_KEY in the server environment.");
            return;
        }

        const ai = new GoogleGenAI({ apiKey: effectiveApiKey });

        // 1. Retrieve Context
        let chunks;
        try {
            chunks = await searchRelevantChunks(queryText, effectiveApiKey, userId);
        } catch (searchError) {
            logger.error(`Search failed: ${searchError.message}`);

            if (searchError.message?.includes('429') || searchError.message?.includes('quota')) {
                onChunk("⏳ The AI service is temporarily rate-limited. Please wait a moment and try again");
                return;
            }

            onChunk("I encountered an error searching the knowledge base. Please ensure documents have been uploaded and processed successfully");
            return;
        }

        if (!chunks || chunks.length === 0) {
            logger.warn(`No relevant chunks found for query: "${queryText}"`);
            onChunk("I couldn't find any relevant information in the uploaded documents. Please make sure you've uploaded SOPs related to your question and that they have been fully processed, (status: completed)");
            return;
        }

        // Filter out zero-score chunks
        const relevantChunks = chunks.filter(c => (c.score || 0) > 0);

        if (relevantChunks.length === 0) {
            logger.warn(`All chunks scored zero for query: "${queryText}"`);
            onChunk("I found some documents but none were closely related to your question. Could you try rephrasing your query?");
            return;
        }

        logger.info(`Found ${relevantChunks.length} relevant chunks. Top score: ${relevantChunks[0]?.score?.toFixed(4) || 'N/A'}`);

        // 2. Build Context String
        let contextString = "";
        let sources = [];

        relevantChunks.forEach((c, idx) => {
            contextString += `[Chunk ${idx + 1} - Source: ${c.documentName}, Page: ${c.page}, Section: ${c.section}]\n${c.text}\n\n`;
            sources.push({ documentName: c.documentName, page: c.page, section: c.section });
        });

        // 3. System Prompt — clear, structured instructions
        const prompt = `You are an enterprise SOP assistant named OpsMind. You help employees find information from their company's Standard Operating Procedures.

RULES:
- Answer ONLY based on the provided context below. Do NOT use your own knowledge.
- If the context contains relevant information, provide a detailed, helpful answer.
- If the answer is partially found, share what you found and note what's missing.
- ALWAYS cite your sources in the format: (Source: Document Name, Page X)
- Use bullet points, numbered lists, and clear formatting when appropriate.
- Be professional, helpful, and thorough.
- If the context truly does not contain any relevant information, explicitly state: "I don't know." Do not provide any other information.

CONTEXT FROM UPLOADED DOCUMENTS:
${contextString}

USER QUESTION:
${queryText}

Please provide a comprehensive answer based on the context above:`;

        // 4. Stream from Gemini with clean retry
        try {
            const result = await generateWithRetry(ai, prompt);

            let hasContent = false;
            for await (const chunk of result) {
                // The @google/genai SDK exposes `.text` as a property on stream chunks
                const chunkText = chunk.text;
                if (chunkText) {
                    hasContent = true;
                    onChunk(chunkText);
                }
            }

            // If stream completed but no text was generated
            if (!hasContent) {
                logger.warn('Gemini stream completed with no text output');
                onChunk("I received an empty response from the AI. This usually means the context didn't match your question well. Please try rephrasing your query.");
            }
        } catch (genError) {
            const msg = genError.message || '';
            if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
                onChunk("⏳ The AI service quota has been exceeded. Please wait a few minutes and try again or provide your own Gemini API key via profile settings");
                return;
            }
            throw genError;
        }

        // Send metadata as a final special chunk
        onChunk(`\n\n__SOURCES__${JSON.stringify(sources)}`);

    } catch (error) {
        logger.error(`RAG Service Error: ${error.message}`);
        throw error;
    }
};

module.exports = { generateRAGResponse };

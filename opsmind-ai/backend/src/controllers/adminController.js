const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const { parsePDF } = require('../services/pdfParser');
const { chunkText } = require('../services/chunkService');
const { generateEmbedding } = require('../services/embeddingService');
const officeParser = require('officeparser');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const uploadDocument = async (req, res) => {
    const files = req.files || (req.file ? [req.file] : []);
    
    if (files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    const userId = req.body.email; // Extracted from frontend form data

    try {
        let apiKey = req.headers['x-gemini-api-key'];
        if (!apiKey || apiKey === '__USE_SERVER_KEY__' || apiKey.trim() === '') {
            apiKey = process.env.GEMINI_API_KEY;
        }

        const results = [];
        for (const file of files) {
            const doc = await Document.create({
                userId: userId,
                filename: file.filename,
                originalName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                status: 'processing'
            });
            results.push({ documentId: doc._id, name: file.originalname });
            
            processDocument(doc._id, file.path, apiKey, userId).catch(err => {
                logger.error(`Failed processing doc ${doc._id}: ${err.message}`);
            });
        }

        res.status(201).json({
            message: `${files.length} document(s) uploaded and processing started`,
            documents: results
        });
    } catch (error) {
        logger.error(`Upload error: ${error.message}`);
        res.status(500).json({ error: 'Server error during upload' });
    }
};

const processDocument = async (docId, filePath, apiKey, userId) => {
    try {
        let text = '';
        let totalPages = 1;
        
        if (filePath.toLowerCase().endsWith('.pdf')) {
            const parsed = await parsePDF(filePath);
            text = parsed.text;
            totalPages = parsed.numpages || 1;
        } else {
            text = await officeParser.parseOfficeAsync(filePath);
        }

        if (!text || text.trim().length === 0) {
            throw new Error('No text content could be extracted from the document');
        }

        const chunks = chunkText(text, 1500, 150);
        logger.info(`Processing doc ${docId}: ${chunks.length} chunks`);

        let processedChunks = 0;
        let embeddingAvailable = true;

        for (let i = 0; i < chunks.length; i++) {
            const chunkStr = chunks[i];
            if (!chunkStr || chunkStr.trim().length < 10) continue;

            try {
                let embedding = [];
                
                if (embeddingAvailable) {
                    const result = await generateEmbedding(chunkStr, apiKey);
                    if (result) {
                        embedding = result;
                    } else {
                        embeddingAvailable = false;
                        logger.warn('Embeddings unavailable. Storing text-only chunks for keyword search.');
                    }
                }

                await Chunk.create({
                    text: chunkStr,
                    embedding: embedding,
                    userId: userId,
                    documentId: docId,
                    page: Math.max(1, Math.ceil(((i + 1) / chunks.length) * totalPages)),
                    section: `Section ${i + 1}`
                });
                processedChunks++;

                // Small delay between API calls to avoid rate limits
                if (embeddingAvailable && i < chunks.length - 1) {
                    await sleep(300);
                }
            } catch (chunkError) {
                logger.warn(`Chunk ${i + 1} failed: ${chunkError.message}`);
                
                // Still save the text even if embedding failed
                try {
                    await Chunk.create({
                        text: chunkStr,
                        embedding: [],
                        userId: userId,
                        documentId: docId,
                        page: Math.max(1, Math.ceil(((i + 1) / chunks.length) * totalPages)),
                        section: `Section ${i + 1}`
                    });
                    processedChunks++;
                } catch (saveErr) {
                    logger.error(`Failed to save chunk text: ${saveErr.message}`);
                }
            }
        }

        if (processedChunks === 0) {
            throw new Error('Failed to process any chunks.');
        }

        await Document.findByIdAndUpdate(docId, { 
            status: 'completed',
            chunkCount: processedChunks
        });
        logger.info(`Doc ${docId} done: ${processedChunks} chunks (embeddings: ${embeddingAvailable ? 'yes' : 'keyword-only'})`);
    } catch (error) {
        await Document.findByIdAndUpdate(docId, { status: 'failed', errorMessage: error.message });
        throw error;
    }
};

const getDocuments = async (req, res) => {
    try {
        const email = req.query.email;
        const query = email ? { userId: email } : {};
        const docs = await Document.find(query).sort({ createdAt: -1 });
        const enriched = await Promise.all(docs.map(async (doc) => {
            const docObj = doc.toObject();
            docObj.chunkCount = await Chunk.countDocuments({ documentId: doc._id });
            // Count how many chunks have valid embeddings
            docObj.embeddedChunks = await Chunk.countDocuments({ 
                documentId: doc._id, 
                'embedding.0': { $exists: true } 
            });
            return docObj;
        }));
        res.json(enriched);
    } catch (error) {
        logger.error(`Error fetching documents: ${error.message}`);
        res.status(500).json({ error: 'Server error fetching documents' });
    }
};

const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const email = req.query.email;
        
        const query = { _id: id };
        if (email) query.userId = email;

        const doc = await Document.findOne(query);
        if (!doc) return res.status(404).json({ error: 'Document not found' });

        await Chunk.deleteMany({ documentId: id });
        try {
            const fp = path.join('uploads', doc.filename);
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        } catch (e) {}

        await Document.findByIdAndDelete(id);
        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting document: ${error.message}`);
        res.status(500).json({ error: 'Server error deleting document' });
    }
};

module.exports = { uploadDocument, getDocuments, deleteDocument };

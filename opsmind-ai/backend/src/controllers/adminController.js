const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const ChatSession = require('../models/ChatSession');
const { parsePDF } = require('../services/pdfParser');
const { chunkText } = require('../services/chunkService');
const { generateEmbedding } = require('../services/embeddingService');
const officeParser = require('officeparser');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const os = require('os');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const uploadDocument = async (req, res) => {
    const files = req.files || (req.file ? [req.file] : []);
    
    if (files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    // Identity from JWT — no longer trusted from request body
    const userId = req.user.email;
    const sessionId = req.body.sessionId; // Extract sessionId from request body

    try {
        let apiKey = req.headers['x-gemini-api-key'];
        if (!apiKey || apiKey === '__USE_SERVER_KEY__' || apiKey.trim() === '') {
            apiKey = process.env.GEMINI_API_KEY;
        }

        const results = [];
        for (const file of files) {
            const filename = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
            const doc = await Document.create({
                userId: userId,
                sessionId: sessionId,
                filename: filename,
                originalName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                status: 'processing',
                fileData: file.buffer
            });
            results.push({ documentId: doc._id, name: file.originalname });
            
            processDocument(doc._id, file.buffer, filename, apiKey, userId, sessionId).catch(err => {
                logger.error(`Failed processing doc ${doc._id}: ${err.message}`);
            });
        }

        res.status(201).json({
            message: `${files.length} document(s) uploaded and processing started`,
            documents: results
        });
    } catch (error) {
        logger.error(`Upload error: ${error.stack}`);
        res.status(500).json({ error: `Server error during upload: ${error.message}` });
    }
};

const processDocument = async (docId, fileBuffer, filename, apiKey, userId, sessionId) => {
    try {
        let text = '';
        let totalPages = 1;
        
        const tempPath = path.join(os.tmpdir(), filename);
        fs.writeFileSync(tempPath, fileBuffer);

        try {
            if (filename.toLowerCase().endsWith('.pdf')) {
                const parsed = await parsePDF(tempPath);
                text = parsed.text;
                totalPages = parsed.numpages || 1;
            } else {
                text = await officeParser.parseOfficeAsync(tempPath);
            }
        } finally {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
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
                    sessionId: sessionId,
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
                        sessionId: sessionId,
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
        // Scope query strictly to the authenticated user and optionally to a specific chat session
        const sessionId = req.query.sessionId;
        const query = { userId: req.user.email };
        if (sessionId) {
            query.sessionId = sessionId;
        }

        const docs = await Document.find(query).select('-fileData').sort({ createdAt: -1 });
        const enriched = await Promise.all(docs.map(async (doc) => {
            const docObj = doc.toObject();
            docObj.chunkCount = await Chunk.countDocuments({ documentId: doc._id });
            docObj.embeddedChunks = await Chunk.countDocuments({ 
                documentId: doc._id, 
                'embedding.0': { $exists: true } 
            });
            
        if (docObj.sessionId && docObj.sessionId !== 'private') {
                // Guard: only query MongoDB if sessionId looks like a valid ObjectId (24 hex chars)
                const isValidObjectId = /^[a-f\d]{24}$/i.test(docObj.sessionId);
                if (isValidObjectId) {
                    const session = await ChatSession.findById(docObj.sessionId).lean();
                    docObj.chatTitle = session ? session.title : 'Deleted Chat';
                } else {
                    // Ghost session (e.g. "ghost-1234") — not yet persisted in DB
                    docObj.chatTitle = 'New Chat';
                }
            } else if (docObj.sessionId === 'private') {
                docObj.chatTitle = 'Private Chat';
            } else {
                docObj.chatTitle = 'Global (No Chat)';
            }
            
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

        // Ownership check — must belong to the authenticated user
        const doc = await Document.findOne({ _id: id, userId: req.user.email });
        if (!doc) return res.status(404).json({ error: 'Document not found or access denied' });

        await Chunk.deleteMany({ documentId: id });
        await Document.findByIdAndDelete(id);
        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting document: ${error.message}`);
        res.status(500).json({ error: 'Server error deleting document' });
    }
};

/**
 * Secure authenticated file download.
 * Replaces public static /uploads serving.
 * Checks ownership before streaming the file.
 */
const downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Document.findOne({ _id: id, userId: req.user.email });
        if (!doc) return res.status(404).json({ error: 'Document not found or access denied' });

        if (doc.fileData) {
            res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
            res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
            return res.send(Buffer.from(doc.fileData));
        } else if (doc.filename) {
            // Fallback for legacy documents stored on disk before the memoryStorage migration
            const filePath = path.resolve(__dirname, '../../uploads', doc.filename);
            if (fs.existsSync(filePath)) {
                res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
                res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
                return res.sendFile(filePath);
            }
        }
        
        return res.status(404).json({ error: 'Document file data not found on server or database' });
    } catch (error) {
        logger.error(`Error downloading document: ${error.message}`);
        res.status(500).json({ error: 'Server error downloading document' });
    }
};

const deleteAllDocuments = async (req, res) => {
    try {
        const docs = await Document.find({ userId: req.user.email });
        for (const doc of docs) {
            await Chunk.deleteMany({ documentId: doc._id });
        }
        await Document.deleteMany({ userId: req.user.email });
        res.json({ message: 'All documents deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting all documents: ${error.message}`);
        res.status(500).json({ error: 'Server error deleting all documents' });
    }
};

const deletePrivateDocuments = async (req, res) => {
    try {
        const docs = await Document.find({ userId: req.user.email, sessionId: 'private' });
        for (const doc of docs) {
            await Chunk.deleteMany({ documentId: doc._id });
        }
        await Document.deleteMany({ userId: req.user.email, sessionId: 'private' });
        res.json({ message: 'Private documents deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting private documents: ${error.message}`);
        res.status(500).json({ error: 'Server error deleting private documents' });
    }
};

module.exports = { uploadDocument, getDocuments, deleteDocument, downloadDocument, deleteAllDocuments, deletePrivateDocuments };

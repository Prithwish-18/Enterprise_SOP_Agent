const ChatSession = require('../models/ChatSession');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const cleanupOldData = async (userEmail) => {
    try {
        const cutoffDate = new Date(Date.now() - THIRTY_DAYS_MS);

        //Find and delete 30-day old sessions
        const oldSessions = await ChatSession.find({ 
            userId: userEmail, 
            updatedAt: { $lt: cutoffDate } 
        });

        if (oldSessions.length > 0) {
            const oldSessionIds = oldSessions.map(s => s._id.toString());
            
            // Delete these sessions
            await ChatSession.deleteMany({ _id: { $in: oldSessionIds } });
            
            // Also delete any documents tied to these sessions
            const docsToDelete = await Document.find({ 
                userId: userEmail, 
                sessionId: { $in: oldSessionIds } 
            });

            for (const doc of docsToDelete) {
                await Chunk.deleteMany({ documentId: doc._id });
                try {
                    const fp = path.join('uploads', doc.filename);
                    if (fs.existsSync(fp)) fs.unlinkSync(fp);
                } catch (e) {}
            }
            await Document.deleteMany({ _id: { $in: docsToDelete.map(d => d._id) } });
            logger.info(`Cleaned up ${oldSessions.length} old sessions for user ${userEmail}`);
        }

        // Find and delete 30-day old standalone/global documents
        const oldDocs = await Document.find({
            userId: userEmail,
            createdAt: { $lt: cutoffDate }
        });

        if (oldDocs.length > 0) {
            for (const doc of oldDocs) {
                await Chunk.deleteMany({ documentId: doc._id });
                try {
                    const fp = path.join('uploads', doc.filename);
                    if (fs.existsSync(fp)) fs.unlinkSync(fp);
                } catch (e) {}
            }
            await Document.deleteMany({ _id: { $in: oldDocs.map(d => d._id) } });
            logger.info(`Cleaned up ${oldDocs.length} old documents for user ${userEmail}`);
        }
    } catch (error) {
        logger.error(`Error during cleanup for ${userEmail}: ${error.message}`);
    }
};

module.exports = { cleanupOldData };

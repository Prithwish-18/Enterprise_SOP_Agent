const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadDocument, getDocuments, deleteDocument, downloadDocument, deleteAllDocuments, deletePrivateDocuments } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const fs = require('fs');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, Word, and PowerPoint files are allowed.'), false);
    }
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// All routes are JWT-protected
router.post('/upload', protect, (req, res, next) => {
    upload.array('document', 10)(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(500).json({ error: `Unknown upload error: ${err.message}` });
        }
        next();
    });
}, uploadDocument);
router.get('/documents', protect, getDocuments);
router.delete('/documents/private', protect, deletePrivateDocuments);
router.delete('/documents/:id', protect, deleteDocument);
router.delete('/documents', protect, deleteAllDocuments);
// Secure authenticated download — replaces public static serving
router.get('/documents/:id/download', protect, downloadDocument);

module.exports = router;

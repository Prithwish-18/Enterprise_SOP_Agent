const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadDocument, getDocuments, deleteDocument } = require('../controllers/adminController');

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
    }
});

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

// Support up to 10 files at once
router.post('/upload', upload.array('document', 10), uploadDocument);
router.get('/documents', getDocuments);
router.delete('/documents/:id', deleteDocument);

module.exports = router;

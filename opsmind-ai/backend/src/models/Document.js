const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    userId: { type: String, required: false, index: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['uploaded', 'processing', 'completed', 'failed'], default: 'uploaded' },
    errorMessage: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    chunkCount: { type: Number, default: 0 }
},{
    timestamps: true   
});

module.exports = mongoose.model('Document', documentSchema);

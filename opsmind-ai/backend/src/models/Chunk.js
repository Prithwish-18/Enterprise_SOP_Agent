const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
    text: { type: String, required: true },
    embedding: { type: [Number], default: [] },
    userId: { type: String, required: false, index: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    page: { type: Number, required: true },
    section: { type: String }
});

module.exports = mongoose.model('Chunk', chunkSchema);

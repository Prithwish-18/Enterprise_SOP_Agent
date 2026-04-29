const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    id: { type: String, required: true },
    sender: { type: String, enum: ['user', 'ai'], required: true },
    text: { type: String, required: false },
    sources: { type: mongoose.Schema.Types.Mixed, required: false },
    timestamp: { type: Date, default: Date.now }
});

const chatSessionSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true }, // we use email as userId for now
    title: { type: String, required: true, default: 'New Chat' },
    messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);

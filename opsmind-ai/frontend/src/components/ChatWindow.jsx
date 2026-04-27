import React, { useRef, useEffect, useState } from 'react';
import { Send, Loader2, Plus, FileUp } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import MessageBubble from './MessageBubble';
import { uploadSOP } from '../services/api';

const ChatWindow = ({ onUploadSuccess }) => {
    const { messages, isTyping, sendMessage } = useChat();
    const [input, setInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !isTyping) {
            sendMessage(input);
            setInput('');
        }
    };

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                await uploadSOP(file);
                if (onUploadSuccess) onUploadSuccess();
                // Optionally show a success toast here
            } catch (error) {
                console.error("Upload failed", error);
                // Optionally show an error toast here
            } finally {
                setIsUploading(false);
                // Reset input of the pdf
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="flex flex-col h-full max-w-4xl w-full mx-auto p-4 md:p-6 gap-6">
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-tr from-brand-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl">
                            <FileUp size={32} />
                        </div>
                        <h2 className="text-2xl font-semibold">Welcome to OpsMind</h2>
                        <p className="max-w-md">I am your enterprise corporate knowledge brain. Ask me any question based on the uploaded SOPs. You can upload PDFs, Word Docs, or PPTs using the + button below.</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))
                )}
                {isTyping && (
                    <div className="flex items-center gap-2 text-brand-400 opacity-70 ml-12">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Agent is thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="relative mt-auto">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={handleFileChange}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isTyping}
                    className="absolute left-2 top-2 bottom-2 aspect-square flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                    title="Upload Document"
                >
                    {isUploading ? <Loader2 size={20} className="animate-spin text-brand-500" /> : <Plus size={20} />}
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about corporate policies or upload docs..."
                    className="w-full glass rounded-xl py-4 pl-12 pr-14 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow text-gray-100 placeholder-gray-500"
                    disabled={isTyping}
                />
                <button
                    type="submit"
                    disabled={isTyping || !input.trim()}
                    className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-brand-600"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;

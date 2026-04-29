import React, { useRef, useEffect, useState } from 'react';
import { Send, Loader2, Plus, FileUp, Sparkles } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import MessageBubble from './MessageBubble';
import { uploadSOP } from '../services/api';

const ChatWindow = ({ onUploadSuccess, documents = [], userEmail }) => {
    const { messages, isTyping, sendMessage } = useChat();
    const [input, setInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const chatInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const noDocs = documents.length === 0;

    // Auto-focus input when AI finishes typing
    useEffect(() => {
        if (!isTyping && !noDocs && chatInputRef.current) {
            chatInputRef.current.focus();
        }
    }, [isTyping, noDocs]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (noDocs) return;
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
                await uploadSOP([file], userEmail);
                if (onUploadSuccess) onUploadSuccess();
            } catch (error) {
                console.error("Upload failed", error);
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-3 sm:p-4 md:p-6 gap-4">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
                             style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                            <Sparkles size={32} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-200">
                                {noDocs ? "Please upload a SOP document first" : "Welcome to OpsMind"}
                            </h2>
                            <p className="text-gray-500 mt-2 max-w-md text-sm sm:text-base leading-relaxed">
                                {noDocs ? "You need to upload at least one document before you can start asking questions" : "Ask questions about your uploaded SOPs"}
                            </p>
                            <p className="text-gray-500 mt-1 max-w-md text-sm sm:text-base leading-relaxed">
                                Use the <strong className="text-gray-400">+</strong> button below to upload documents directly
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                            {!noDocs && (
                                documents.slice(0, 3).map((doc, i) => {
                                    // Remove extension for cleaner look
                                    const docName = doc.originalName.replace(/\.[^/.]+$/, "");
                                    const questions = [
                                        `Summarize ${docName}`,
                                        `What are the key points in ${docName}?`,
                                        `Explain the policies in ${docName}`
                                    ];
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => { sendMessage(questions[i % 3]); }}
                                            className="text-xs px-3 py-2 rounded-lg text-gray-400 hover:text-gray-200 transition-all"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            {questions[i % 3]}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ) : (
                    messages.map(msg => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))
                )}
                {isTyping && (
                    <div className="flex items-center gap-2 ml-12 animate-fade-in">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span className="text-sm text-gray-500">Thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="relative mt-auto shrink-0">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={handleFileChange}/>
                <div className="glass rounded-xl flex items-center gap-1 p-1.5">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isTyping}
                        className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50 shrink-0"
                        title="Upload Document">
                        {isUploading ? <Loader2 size={18} className="animate-spin text-blue-400" /> : <Plus size={18} />}
                    </button>
                    <input
                        type="text"
                        ref={chatInputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={noDocs ? "Please upload a SOP document first..." : "Ask about your SOPs . . ."}
                        className={`flex-1 bg-transparent py-2.5 px-2 focus:outline-none text-sm sm:text-base min-w-0 ${noDocs ? 'text-gray-500 placeholder-gray-600 cursor-not-allowed' : 'text-gray-100 placeholder-gray-500'}`}
                        disabled={isTyping || noDocs}
                        autoFocus={!noDocs}/>
                    <button
                        type="submit"
                        disabled={isTyping || noDocs || !input.trim()}
                        className="p-2.5 rounded-lg text-white transition-all disabled:opacity-30 shrink-0"
                        style={{ background: (!noDocs && input.trim()) ? 'linear-gradient(135deg, #2563eb, #4f46e5)' : 'transparent' }}>
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatWindow;

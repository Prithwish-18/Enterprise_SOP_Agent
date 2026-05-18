import React, { useRef, useEffect, useState } from 'react';
import { Send, Loader2, Plus, FileUp, Sparkles, Shield } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import MessageBubble from './MessageBubble';
import { uploadSOP } from '../services/api';
import privateChat from "../assets/private_chat.png"

const ChatWindow = ({ onUploadSuccess, documents = [], authToken, activeSessionId }) => {
    const { messages, isTyping, sendMessage, isPrivateMode, masked, materializeGhost, pendingSessionRef } = useChat();
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

    useEffect(() => {
        if (!isTyping && !noDocs && chatInputRef.current) {
            chatInputRef.current.focus();
        }
    }, [isTyping, noDocs]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (noDocs) {
            alert("Please upload a document to begin chatting");
            return;
        }
        if (!input.trim() || isTyping) return;
        sendMessage(input);
        setInput('');
    };

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                let targetSessionId = isPrivateMode ? 'private' : activeSessionId;
                if (!isPrivateMode && pendingSessionRef?.current && pendingSessionRef.current === activeSessionId) {
                    const realId = await materializeGhost();
                    if (realId) targetSessionId = realId;
                }
                await uploadSOP([file], authToken, targetSessionId);
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
        <div className={`flex flex-col h-full w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6 pt-0 pb-0 gap-0 transition-all duration-500 overflow-hidden ${isPrivateMode ? 'bg-purple-900/10 shadow-[inset_0_0_50px_rgba(168,85,247,0.05)]' : ''}`}>
            <div className={`flex-1 overflow-y-auto space-y-4 pt-12 pb-4 pr-1 ${messages.length > 0 ? 'scrollbar-thin' : '[&::-webkit-scrollbar]:hidden'} ${masked ? 'blur-md opacity-50 select-none pointer-events-none transition-all duration-300' : 'transition-all duration-300'}`}>
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-4">
                        <div className="items-center justify-center">
                            {isPrivateMode ? <img src={privateChat} className="h-25 w-30" /> : <img src="/logo.png" className="h-25 w-30" />}
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-200">
                                {noDocs ? "Please upload a SOP document first" : isPrivateMode ? "Private Workspace" : "Welcome to OpsMind Ai"}
                            </h2>
                            <p className="text-gray-500 mt-2 max-w-md text-sm sm:text-base leading-relaxed">
                                {noDocs ? "You need to upload at least one document before you can start asking questions" : isPrivateMode ? "Ask me anything. Your chat history will not be saved." : "Ask questions about your uploaded SOPs"}
                            </p>
                            <p className="text-gray-500 mt-1 max-w-md text-sm sm:text-base leading-relaxed">
                                Use the <strong className="text-gray-400">+</strong> button below to upload documents directly
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                            {!noDocs && (
                                documents.slice(0, 3).map((doc, i) => {
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

            {/* Input — pinned at bottom, padding ensures safe area above iOS home indicator */}
            <div className="chat-form-bar shrink-0 pt-2 px-1">
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        onChange={handleFileChange} />
                    <div className="glass rounded-xl flex items-center gap-1 p-1.5">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || isTyping}
                            className={`p-2.5 rounded-lg text-gray-400 transition-all shrink-0 hover:text-white hover:bg-white/5 disabled:opacity-50`}
                            title="Upload Document">
                            {isUploading ? <Loader2 size={18} className="animate-spin text-blue-400" /> : <Plus size={18} />}
                        </button>
                        <input
                            type="text"
                            ref={chatInputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={noDocs ? "Please upload a SOP document first..." : isPrivateMode ? "Ask a private question..." : "Ask about your SOPs . . ."}
                            className={`flex-1 bg-transparent py-2.5 px-2 focus:outline-none text-sm sm:text-base min-w-0 ${noDocs ? 'text-gray-500 placeholder-gray-600 cursor-not-allowed' : 'text-gray-100 placeholder-gray-500'}`}
                            disabled={isTyping || noDocs}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="sentences"
                            spellCheck="true"
                            name="chat-input-message"
                            autoFocus={!noDocs} />
                        <button
                            type="submit"
                            disabled={isTyping || noDocs || !input.trim()}
                            className={`p-2.5 rounded-lg text-white transition-all disabled:opacity-30 shrink-0 ${isPrivateMode && input.trim() && !isTyping ? 'shadow-[0_0_15px_rgba(168,85,247,0.4)]' : ''}`}
                            style={{ background: (!noDocs && input.trim()) ? (isPrivateMode ? 'linear-gradient(135deg, #a855f7, #7e22ce)' : 'linear-gradient(135deg, #2563eb, #4f46e5)') : 'transparent' }}>
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;

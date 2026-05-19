import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatContext } from '../context/ChatContext';
import { getSharedSession } from '../services/api';
import MessageBubble from '../components/MessageBubble';
import { MessageSquare, AlertTriangle, ArrowLeft, Send, Loader2, Sparkles, LogIn } from 'lucide-react';
import user from '../assets/user.png';

const SharedChatPage = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { authToken, importSharedSession } = useContext(ChatContext);

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [input, setInput] = useState('');
    const [importing, setImporting] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                setLoading(true);
                const data = await getSharedSession(sessionId);
                setSession(data);
            } catch (err) {
                console.error(err);
                setError(err.message || 'Shared chat not found or access expired');
            } finally {
                setLoading(false);
            }
        };
        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [session]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !session || importing) return;
        if (!authToken) {
            navigate('/login', { state: { isLogin: true } });
            return;
        }

        try {
            setImporting(true);
            const userMsg = {
                id: 'user-' + Date.now(),
                sender: 'user',
                text: input,
                createdAt: new Date().toISOString()
            };
            const updatedSharedMessages = [...(session.messages || []), userMsg];
            
            // Clone/Import session into user's account and get new session ID
            const newSessionId = await importSharedSession(session.title, updatedSharedMessages);
            if (newSessionId) {
                navigate('/chat');
            }
        } catch (err) {
            alert('Failed to send message: ' + err.message);
        } finally {
            setImporting(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-[#0a0f1d] text-white">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                    <span className="text-gray-400 text-sm font-semibold tracking-wider animate-pulse">LOADING SHARED CHAT . . .</span>
                </div>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="w-full h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-[#0a0f1d] px-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80px h-80px bg-blue-600/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <div className="glass max-w-md w-full p-8 rounded-2xl border border-red-500/20 shadow-2xl flex flex-col items-center text-center relative z-10"
                     style={{ background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(20px)' }}>
                        <AlertTriangle className="text-red-400 h-8 w-8 animate-bounce mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-3">Unable to Load Chat</h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-8">{error || 'This shared link is invalid or the chat was deleted'}</p>
                    <button 
                        onClick={() => navigate('/')} 
                        className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2">
                        <ArrowLeft size={16} /> Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-[calc(100vh-64px)] flex flex-col bg-[#070b15] text-white relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-1/4 w-100 h-100 bg-blue-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-1/4 w-75 h-75 bg-indigo-600/5 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 shrink-0 px-6 py-4 border-b border-white/5 bg-[#0a0f1d]/80 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/')} 
                        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                        title="Go back">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-md sm:text-lg font-bold text-gray-200 truncate max-w-50 sm:max-w-xs">{session.title}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-[10px] sm:text-xs font-semibold text-emerald-400/90 tracking-wider uppercase">Shared Chat View</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Timeline */}
            <div className="flex-1 overflow-y-auto relative z-10 px-4 py-8 space-y-6 scrollbar-thin">
                <div className="max-w-3xl mx-auto space-y-6">
                    {session.messages && session.messages.length > 0 ? (
                        session.messages.map((msg) => (
                            <MessageBubble key={msg.id || msg._id} message={msg} />
                        ))
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            No messages found in this shared session
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Pinned Input / Join CTA */}
            <div className="relative z-10 shrink-0 border-t border-white/5 bg-[#0a0f1d]/90 backdrop-blur-md p-4 sm:p-6">
                <div className="max-w-3xl mx-auto">
                    {importing ? (
                        <div className="w-full flex items-center justify-center gap-3 py-4 text-sm text-blue-400 font-semibold animate-pulse">
                            <Loader2 className="animate-spin" size={16} /> Creating secure copy in your workspace . . .
                        </div>
                    ) : !authToken ? (
                        /* CTA for Unauthenticated Users */
                        <div className="glass rounded-2xl p-4 sm:p-5 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
                            <div className="flex items-center gap-3.5">
                                <div className="h-10 w-10 flex items-center justify-center text-blue-400">
                                    <MessageSquare size={20} />
                                </div>
                                <div className="text-center sm:text-left">
                                    <h4 className="font-semibold text-gray-200 text-sm sm:text-base">Join the Conversation</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">Please sign in to reply or ask custom questions regarding SOPs</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/login', { state: { isLogin: true } })}
                                className="w-full sm:w-auto py-2.5 px-5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm cursor-pointer hover:scale-105">
                                <LogIn size={15} /> Log In to Message
                            </button>
                        </div>
                    ) : (
                        /* Input box for Authenticated Users */
                        <form onSubmit={handleSend} className="relative">
                            <div className="glass rounded-xl flex items-center gap-2 p-1.5 border border-white/10 shadow-lg">
                                <div className="p-2.5 rounded-lg text-gray-500 shrink-0">
                                    <img src={user} className="w-6 h-6 object-cover rounded-full" />
                                </div>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message to import and continue chatting . . ."
                                    className="flex-1 bg-transparent py-2.5 px-2 focus:outline-none text-sm sm:text-base min-w-0 text-gray-100 placeholder-gray-500"
                                    autoComplete="off"
                                    autoFocus
                                    name="shared-chat-input"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="p-2.5 rounded-lg text-white transition-all disabled:opacity-30 shrink-0 hover:scale-105"
                                    style={{ background: input.trim() ? 'linear-gradient(135deg, #2563eb, #4f46e5)' : 'transparent' }}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SharedChatPage;

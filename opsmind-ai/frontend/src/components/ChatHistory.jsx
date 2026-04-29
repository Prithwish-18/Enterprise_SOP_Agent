import React from 'react';
import { MessageSquarePlus, MessageSquare, Trash2, X, Clock, Edit2, AlertCircle } from 'lucide-react';
import { useChat } from '../hooks/useChat';

const ChatHistory = ({ isOpen, setOpen }) => {
    const { sessions, activeSessionId, createNewSession, switchSession, deleteSession, clearAllSessions, renameSession } = useChat();

    // Remove the sidebar if there's no history (basic new chat)
    if (sessions.length === 0) return null;

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/50"
                    onClick={() => setOpen(false)}/>
            )}

            {/* Sidebar */}
            <div className={`
                fixed right-0 top-0 md:relative z-50 md:z-auto
                w-72 md:w-64 h-full
                glass flex flex-col
                border-l border-white/5
                transition-transform duration-300
                ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Clock size={14} /> History
                    </h2>
                    {sessions.length > 0 && (
                        <button
                            onClick={() => clearAllSessions()}
                            className="ml-1 p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                            title="Clear all history">
                            <Trash2 size={13} />
                        </button>
                    )}
                    <button
                        onClick={() => setOpen(false)}
                        className="md:hidden p-1 text-gray-500 hover:text-white rounded">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-3 border-b border-white/5 space-y-2">
                    <button
                        onClick={() => {
                            createNewSession();
                            if (window.innerWidth < 768) setOpen(false);
                        }}
                        className="w-full py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff' }}>
                        <MessageSquarePlus size={16} />
                        New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                    {sessions.length === 0 ? (
                        <div className="text-xs text-gray-500 p-2 text-center mt-4">No chat history yet.</div>
                    ) : (
                        sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => {
                                    switchSession(session.id);
                                    if (window.innerWidth < 768) setOpen(false);
                                }}
                                className={`group p-3 rounded-xl flex items-start gap-2.5 transition-all cursor-pointer ${activeSessionId === session.id
                                    ? 'bg-blue-500/10 border-blue-500/30'
                                    : 'hover:bg-white/5 border-transparent'
                                    }`}
                                style={{ border: '1px solid', borderColor: activeSessionId === session.id ? 'rgba(59,130,246,0.3)' : 'transparent' }}>
                                <div className={`mt-0.5 shrink-0 ${activeSessionId === session.id ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                    <MessageSquare size={15} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium truncate transition-colors ${activeSessionId === session.id ? 'text-blue-100' : 'text-gray-400 group-hover:text-gray-200'
                                        }`} title={session.title}>
                                        {session.title}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {new Date(session.updatedAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex items-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newTitle = window.prompt("Enter new chat name:", session.title);
                                            if (newTitle) renameSession(session.id, newTitle);
                                        }}
                                        className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-all cursor-pointer"
                                        title="Rename chat">
                                        <Edit2 size={13} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSession(session.id);
                                        }}
                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer"
                                        title="Delete chat">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default ChatHistory;

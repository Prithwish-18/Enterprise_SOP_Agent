import React, { useState, useRef, useEffect } from 'react';
import {MessageSquarePlus, MessageSquare, Trash2, X, Clock, Edit2, Shield, Search, Beaker, LayoutDashboard, Archive, ArchiveRestore, ChevronDown, ChevronUp, MoreHorizontal, Lock, EyeOff, Share, PanelRightClose, PanelRight
} from 'lucide-react';
import { useChat } from '../hooks/useChat';
import history from "../assets/history.png";
import lock from "../assets/lock.png";
import shield from "../assets/shield.png";

const ChatMenu = ({ session, isArchived, onArchive, onUnarchive, onRename, onDelete, isLast }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const item = (label, icon, colorClass, action) => (
        <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); action(e); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-white/5 rounded-lg ${colorClass}`}>
            {icon}
            {label}
        </button>
    );

    return (
        <div ref={ref} className="relative shrink-0" onClick={e => e.stopPropagation()}>
            <button
                onClick={() => setOpen(!open)}
                className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                title="More options">
                <MoreHorizontal size={14} />
            </button>

            {open && (
                <div
                    className={`absolute right-0 ${isLast ? 'bottom-full mb-1' : 'top-full mt-1'} w-44 rounded-xl overflow-hidden shadow-2xl z-100 p-1`}
                    style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
                    {item('Rename', <Edit2 size={13} />, 'text-gray-400 hover:text-blue-300', () => {
                        const t = window.prompt('Rename chat:', session.title);
                        if (t && t.trim()) onRename(session.id, t.trim());
                    })}
                    {item('Share', <Share size={13} />, 'text-gray-400 hover:text-green-300', () => {
                        const link = `${window.location.origin}/share/${session.id}`;
                        navigator.clipboard.writeText(link);
                        alert(`Share link generated and copied to clipboard!\n${link}`);
                    })}
                    {isArchived
                        ? item('Unarchive', <ArchiveRestore size={13} />, 'text-gray-400 hover:text-orange-300', (e) => onUnarchive(e, session.id))
                        : item('Archive', <Archive size={13} />, 'text-gray-400 hover:text-orange-300', (e) => onArchive(e, session.id))
                    }
                    <div className="my-1 border-t border-white/5" />
                    {item('Delete', <Trash2 size={13} />, 'text-gray-400 hover:text-red-400', () => {
                        if (window.confirm(`Delete "${session.title}"?`)) onDelete(session.id);
                    })}
                </div>
            )}
        </div>
    );
};

const ChatHistory = ({ isOpen, setOpen }) => {
    const {
        sessions, activeSessionId, createNewSession, switchSession, deleteSession,
        clearAllSessions, renameSession,
        isPrivateMode, setIsPrivateMode, isDeepResearch, setIsDeepResearch, setPrivateMessages,
        archivedIds, archiveSession, unarchiveSession
    } = useChat();

    const [searchQuery, setSearchQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [showPrivateModal, setShowPrivateModal] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);

    useEffect(() => {
        const handleToggle = () => setDesktopCollapsed(prev => !prev);
        window.addEventListener('toggle-history-desktop', handleToggle);
        return () => window.removeEventListener('toggle-history-desktop', handleToggle);
    }, []);

    // Private mode: completely hide the history sidebar — no chat data should be exposed
    if (isPrivateMode) return null;

    const activeSessions = sessions.filter(s => !archivedIds.includes(s.id));
    const archivedSessions = sessions.filter(s => archivedIds.includes(s.id));
    const filteredActive = activeSessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredArchived = archivedSessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const handlePrivateChat = () => {
        setShowPrivateModal(true);
    };

    const confirmPrivateChat = () => {
        setIsPrivateMode(true);
        setPrivateMessages([]);
        setShowPrivateModal(false);
        if (window.innerWidth < 768) setOpen(false);
    };

    const handleArchive = (e, sessionId) => {
        e.stopPropagation();
        archiveSession(sessionId);
        if (activeSessionId === sessionId) {
            const remaining = activeSessions.filter(s => s.id !== sessionId);
            if (remaining.length > 0) switchSession(remaining[0].id);
            else createNewSession();
        }
    };

    const handleUnarchive = (e, sessionId) => {
        e.stopPropagation();
        unarchiveSession(sessionId);
    };

    const SessionCard = ({ session, isArchived = false, isLast = false }) => {
        const isActive = !isPrivateMode && activeSessionId === session.id;

        return (
            <div
                onClick={() => {
                    if (isPrivateMode) setIsPrivateMode(false);
                    switchSession(session.id);
                    if (window.innerWidth < 768) setOpen(false);
                }}
                className={`group relative p-3 rounded-xl transition-all cursor-pointer`}
                style={{
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.04)',
                    background: isActive
                        ? 'rgba(59,130,246,0.09)'
                        : isArchived ? 'rgba(255,165,0,0.03)' : 'rgba(255,255,255,0.02)'
                }}>

                {/* Top: icon + title */}
                <div className="flex items-center gap-2">
                    <div className={`shrink-0 ${isActive ? 'text-blue-400' : isArchived ? 'text-orange-400' : 'text-gray-600 group-hover:text-gray-400'}`}>
                        {isArchived ? <Archive size={13} /> : <MessageSquare size={13} />}
                    </div>
                    <span
                        className={`flex-1 text-sm font-medium truncate ${isActive ? 'text-blue-100' : 'text-gray-400 group-hover:text-gray-200'}`}
                        title={session.title}>
                        {session.title}
                    </span>
                </div>

                {/* Bottom: date + action buttons */}
                <div className="flex items-center justify-between mt-1.5 pl-5.25">
                    <span className="text-[10px] text-gray-600">
                        {new Date(session.updatedAt || Date.now()).toLocaleDateString()}
                    </span>

                    {/* 3-dot dropdown (all devices) */}
                    <div>
                        <ChatMenu
                            session={session}
                            isArchived={isArchived}
                            onArchive={handleArchive}
                            onUnarchive={handleUnarchive}
                            onRename={renameSession}
                            onDelete={deleteSession}
                            isLast={isLast}/>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    onClick={() => setOpen(false)} />
            )}

            {/* Sidebar */}
            <div className={`
                fixed right-0 top-0 md:relative z-50 md:z-auto
                ${desktopCollapsed ? 'md:w-0 md:overflow-hidden' : 'w-80 md:w-72'} h-full flex flex-col
                border-l border-white/5
                transition-all duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                ${isPrivateMode ? 'bg-[#0f0a1a] shadow-[inset_0_0_80px_rgba(168,85,247,0.07)]' : 'glass'}`}>

                {/* Header */}
                <div className={`p-4 border-b flex items-center justify-between ${isPrivateMode ? 'border-purple-500/20 bg-purple-900/20' : 'border-white/5 bg-black/20'}`}>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        {isPrivateMode
                            ? <><Shield size={14} className="text-purple-400" /> Private Mode</>
                            : <><img src={history} className="h-8 w-8" />Workspace</>
                        }
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setDesktopCollapsed(true)}
                            className="hidden md:flex p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-md transition-all" title="Minimize History">
                            <PanelRightClose size={16} />
                        </button>
                        <button onClick={() => setOpen(false)}
                            className="md:hidden p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-md transition-all">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Private Mode Banner */}
                {isPrivateMode && (
                    <div className="mx-3 mt-3 p-3 rounded-xl border border-purple-500/30 bg-purple-900/20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Shield size={14} className="text-purple-400 shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-purple-200">Private Chat Active</p>
                                <p className="text-[10px] text-purple-400/70">Session data wiped on exit</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsPrivateMode(false);
                                setPrivateMessages([]);
                                if (window.innerWidth < 768) setOpen(false);
                            }}
                            className="text-[10px] px-2 py-1 rounded-md border border-purple-500/40 text-purple-300 hover:bg-purple-500/20 transition-colors shrink-0">
                            Exit
                        </button>
                    </div>
                )}

                {/* Actions Panel */}
                <div className={`p-3 border-b space-y-2 ${isPrivateMode ? 'border-purple-500/10' : 'border-white/5'}`}>
                    {/* New Chat + Private */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                createNewSession();
                                if (isPrivateMode) setIsPrivateMode(false);
                                if (window.innerWidth < 768) setOpen(false);
                            }}
                            className="flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                            style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff', boxShadow: '0 4px 15px rgba(37,99,235,0.3)' }}>
                            <MessageSquarePlus size={15} />
                            <span>New Chat</span>
                        </button>

                        {/* Private Chat — compact pill */}
                        <button
                            onClick={isPrivateMode ? () => {
                                setIsPrivateMode(false);
                                setPrivateMessages([]);
                                if (window.innerWidth < 768) setOpen(false);
                            } : handlePrivateChat}
                            className={`shrink-0 px-2 py-2 rounded-xl flex items-center justify-center text-xs font-semibold transition-all border ${
                                isPrivateMode
                                    ? 'text-purple-200 shadow-[0_0_18px_rgba(168,85,247,0.35)]'
                                    : 'text-purple-400/80 hover:text-purple-200 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                            }`}
                            style={{
                                background: isPrivateMode ? 'rgba(168,85,247,0.2)' : 'rgba(168,85,247,0.07)',
                                borderColor: isPrivateMode ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.2)'
                            }}
                            title={isPrivateMode ? 'Exit Private Chat' : 'Start Private Chat'}>
                            <img src={shield} className='h-8 w-8'/>
                            <span className="hidden sm:inline">{isPrivateMode ? 'Exit' : ""}</span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search chats . . ."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            name="sidebar-chat-search"
                            autoComplete="one-time-code"
                            autoCorrect="off"
                            autoCapitalize="off"
                            className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-9 pr-8 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"/>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                                <X size={15} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Recent Chats Header */}
                <div className={`px-3 pt-3 pb-1 flex items-center justify-between ${isPrivateMode ? 'opacity-30 pointer-events-none' : ''}`}>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock size={15} /> Recent Chats
                    </h3>
                    {activeSessions.length > 0 && (
                        <button
                            onClick={() => window.confirm('Delete ALL chat history?') && clearAllSessions()}
                            className="text-[10px] text-gray-600 hover:text-red-400 px-1.5 py-0.5 rounded hover:bg-red-500/10 flex items-center gap-1 transition-colors">
                            <Trash2 size={9} /> Delete All
                        </button>
                    )}
                </div>

                {/* Session List */}
                <div className={`flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin ${isPrivateMode ? 'opacity-30 pointer-events-none' : ''}`}>
                    <div className="space-y-1.5">
                        {isPrivateMode ? (
                            <div className="text-xs text-purple-400/60 p-4 text-center border border-dashed border-purple-500/20 rounded-xl">
                                Chat history hidden in Private Mode
                            </div>
                        ) : filteredActive.length === 0 && searchQuery ? (
                            <div className="text-xs text-gray-500 p-4 text-center">No chats match your search</div>
                        ) : activeSessions.length === 0 ? (
                            <div className="text-xs text-gray-500 p-4 text-center">
                                No chats yet, Start new one above!
                            </div>
                        ) : (
                            filteredActive.map((session, i) => <SessionCard key={session.id} session={session} isLast={filteredActive.length > 2 && i >= filteredActive.length - 2} />)
                        )}
                    </div>

                    {/* Archived Section */}
                    {archivedSessions.length > 0 && !isPrivateMode && (
                        <div className="mt-4 pt-2 border-t border-white/5">
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className="w-full px-1 py-2 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-gray-300 transition-colors mb-1.5">
                                <span className="flex items-center gap-1.5">
                                    <Archive size={10} /> Archived ({archivedSessions.length})
                                </span>
                                {showArchived ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            {showArchived && (
                                <div className="space-y-1.5">
                                    {filteredArchived.map((session, i) => (
                                        <SessionCard key={session.id} session={session} isArchived isLast={true} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Private Mode Confirmation Modal */}
            {showPrivateModal && (
                <div className="fixed inset-0 z-200 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPrivateModal(false)}>
                    <div className="glass w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}
                         style={{ background: 'linear-gradient(180deg, rgba(15,10,25,0.95), rgba(10,5,20,0.98))', border: '1px solid rgba(168,85,247,0.2)' }}>
                        <div className="flex justify-center mb-4">
                            <div className="flex items-center justify-center">
                                <img src={lock} className="h-25 w-30" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-white text-center mb-2">Enter Private Mode</h2>
                        <ul className="text-sm text-gray-400 space-y-3 mb-6">
                            <li className="flex items-center gap-2"><EyeOff size={16} className="text-purple-400" /> Chat history is never saved</li>
                            <li className="flex items-center gap-2"><Lock size={16} className="text-purple-400" /> Uploaded documents are securely isolated</li>
                            <li className="flex items-center gap-2"><X size={16} className="text-purple-400" /> Automatically wiped upon exit</li>
                        </ul>
                        <div className="flex gap-3 mt-auto">
                            <button onClick={() => setShowPrivateModal(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white transition-all">
                                Cancel
                            </button>
                            <button onClick={confirmPrivateChat} className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all">
                                Start
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Expander when collapsed */}
            {desktopCollapsed && (
                <div className="hidden md:flex absolute top-3 right-3 z-30">
                    <button onClick={() => setDesktopCollapsed(false)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-300 transition-all shadow-lg"
                        style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <PanelRight size={14} /> Show History
                    </button>
                </div>
            )}
        </>
    );
};

export default ChatHistory;

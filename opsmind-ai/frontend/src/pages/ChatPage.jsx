import React, { useEffect, useState, useContext, useRef } from 'react';
import ChatWindow from '../components/ChatWindow';
import { getDocuments, deleteDocument } from '../services/api';
import { FileText, Trash2, Loader2, Clock, Upload, X, PanelLeftClose, PanelLeft, History } from 'lucide-react';
import ChatHistory from '../components/ChatHistory';
import { ChatContext } from '../context/ChatContext';
import documentImage from "../assets/document.png";

const StatusDot = ({ status }) => {
    const color = status === 'completed' ? '#3b82f6' : status === 'failed' ? '#f87171' : '#fbbf24';
    return <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5" style={{ background: color }} />;
};

const ChatPage = () => {
    const { authToken, activeSessionId } = useContext(ChatContext);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);  
    const [historyOpen, setHistoryOpen] = useState(false);  
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);
    const pollingRef = useRef(null);
    const fetchDocs = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await getDocuments(authToken);
            const sessionDocs = data.filter(d => d.sessionId === activeSessionId);
            setDocuments(sessionDocs);
        } catch (err) {
            console.error('Failed to fetch documents', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (activeSessionId && !activeSessionId.startsWith('ghost-')) {
            fetchDocs();
        } else {
            setDocuments([]);
            setLoading(false);
        }
    }, [activeSessionId]);

    // Poll while any doc is processing
    useEffect(() => {
        clearInterval(pollingRef.current);
        if (documents.some(d => d.status === 'processing')) {
            pollingRef.current = setInterval(() => fetchDocs(true), 3000);
        }
        return () => clearInterval(pollingRef.current);
    }, [documents]);

    useEffect(() => {
        const handleCleared = () => setDocuments([]);
        window.addEventListener('documents-cleared', handleCleared);
        return () => window.removeEventListener('documents-cleared', handleCleared);
    }, []);

    const handleDelete = async (docId, name) => {
        if (!window.confirm(`Delete "${name}"? This will remove the document and all its indexed data.`)) return;
        setDeletingId(docId);
        try {
            await deleteDocument(docId, authToken);
            setDocuments(prev => prev.filter(d => d._id !== docId));
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        } finally { setDeletingId(null); }
    };
    const sidebarVisible = !desktopCollapsed;
    return (
        <div className="w-full h-full flex overflow-hidden relative"
             style={{ background: 'radial-gradient(ellipse at 80% 10%, rgba(59,130,246,0.06), transparent 50%)' }}>
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
                     onClick={() => setSidebarOpen(false)} />
            )}
            <aside className={[
                'flex flex-col transition-all duration-300 shrink-0 z-50 glass',
                'fixed lg:relative inset-y-0 left-0',
                'w-70',
                sidebarVisible ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            ].join(' ')}
                style={{
                    background: 'linear-gradient(180deg,rgba(15,23,42,0.95) 0%,rgba(7,3,15,0.98) 100%)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                }}>

                {/* Sidebar header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center">
                            <img src={documentImage} className="h-8 w-8" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-300">Documents</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                        <X size={20} />
                    </button>
                    <button onClick={() => setDesktopCollapsed(true)}
                        className="hidden lg:flex p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/5 transition-all"
                        title="Collapse sidebar">
                        <PanelLeftClose size={15} />
                    </button>
                </div>

                {/* Document list */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin">
                    {loading ? (
                        <div className="flex items-center gap-2 text-xs text-gray-400/50 p-3 animate-pulse">
                            <Loader2 size={13} className="animate-spin" /> Loading . . .
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-10 text-center">
                            <div className="w-20 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Upload size={25} className="text-gray-500/40" />
                            </div>
                            <p className="text-s text-gray-500/60 leading-relaxed px-2">No document is uploaded for this chat</p>
                        </div>
                    ) : (
                        documents.map(doc => (
                            <div key={doc._id}
                                 className="group flex items-start gap-2.5 p-3 rounded-xl transition-all hover:bg-white/5 animate-fade-in"
                                 style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <FileText size={14} className="text-blue-400 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <a href={`${import.meta.env.VITE_API_URL || ''}/api/admin/documents/${doc._id}/download?token=${authToken}`}
                                       target="_blank" rel="noopener noreferrer"
                                       className="text-xs font-medium text-gray-300 hover:text-blue-300 truncate block transition-colors"
                                       title={doc.originalName}>
                                        {doc.originalName}
                                    </a>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <StatusDot status={doc.status} />
                                        <span className="text-[10px] capitalize text-gray-500">{doc.status}</span>
                                        {doc.status === 'processing' && <Loader2 size={9} className="animate-spin text-yellow-400" />}
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(doc._id, doc.originalName)}
                                    disabled={deletingId === doc._id}
                                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-40 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shrink-0">                                    {deletingId === doc._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </aside>
            <div className="flex-1 flex flex-col relative min-w-0">
                <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                    <button
                        onClick={() => {
                            if (window.innerWidth >= 1024) setDesktopCollapsed(false);
                            else setSidebarOpen(true);
                        }}
                        className={`pointer-events-auto items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-300 transition-all hover:text-white ${sidebarOpen ? 'hidden' : 'flex'} ${desktopCollapsed ? 'lg:flex' : 'lg:hidden'}`}
                        style={{ background: 'rgba(10,14,26,0.88)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)', boxShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                        <PanelLeft size={13} />
                        <span className="hidden sm:inline">Docs</span>
                        {documents.length > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-400">{documents.length}</span>
                        )}
                    </button>

                    <button
                        onClick={() => {
                            if (window.innerWidth >= 768) window.dispatchEvent(new CustomEvent('toggle-history-desktop'));
                            else setHistoryOpen(true);
                        }}
                        className={`pointer-events-auto items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-300 transition-all hover:text-white md:hidden ${historyOpen ? 'hidden' : 'flex'}`}
                        style={{ background: 'rgba(10,14,26,0.88)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)', boxShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                        <History size={13} />
                        <span className="hidden sm:inline">History</span>
                    </button>
                </div>

                {/* Chat window */}
                <ChatWindow onUploadSuccess={fetchDocs}
                    documents={documents}
                    authToken={authToken}
                    activeSessionId={activeSessionId}/>
            </div>
            <ChatHistory isOpen={historyOpen} setOpen={setHistoryOpen} />
        </div>
    );
};

export default ChatPage;

import React, { useEffect, useState, useContext } from 'react';
import ChatWindow from '../components/ChatWindow';
import { getDocuments, deleteDocument } from '../services/api';
import { FileText, Clock, Trash2, Loader2, ChevronLeft, ChevronRight, X, History } from 'lucide-react';
import ChatHistory from '../components/ChatHistory';
import { ChatContext } from '../context/ChatContext';

const ChatPage = () => {
    const { userEmail } = useContext(ChatContext);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    const fetchDocs = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await getDocuments(userEmail);
            setDocuments(data);
        } catch (error) {
            console.error('Failed to fetch documents history', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, []);

    // Polling for processing documents
    useEffect(() => {
        let intervalId;
        const hasProcessing = documents.some(doc => doc.status === 'processing');
        if (hasProcessing) {
            intervalId = setInterval(() => {
                fetchDocs(true); // silent fetch
            }, 3000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [documents]);

    const handleDelete = async (docId, docName) => {
        if (!window.confirm(`Delete "${docName}"? This will remove the document and all its indexed data.`)) {
            return;
        }
        setDeletingId(docId);
        try {
            await deleteDocument(docId, userEmail);
            setDocuments(prev => prev.filter(d => d._id !== docId));
        } catch (error) {
            console.error('Failed to delete document', error);
            alert('Failed to delete document: ' + error.message);
        } finally {
            setDeletingId(null);
        }
    };

    const statusColor = (status) => {
        if (status === 'completed') return '#34d399';
        if (status === 'failed') return '#f87171';
        return '#fbbf24';
    };

    return (
        <div className="w-full h-full flex overflow-hidden relative"
             style={{ background: 'radial-gradient(ellipse at 80% 10%, rgba(59,130,246,0.06), transparent 50%)' }}>

            {/* Mobile sidebar toggle */}
            <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden absolute top-3 left-3 z-30 p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
                <ChevronRight size={18} />
            </button>

            {/* Mobile history toggle */}
            <button
                onClick={() => setHistoryOpen(true)}
                className="md:hidden absolute top-3 right-3 z-30 p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <History size={18} />
            </button>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/50"
                    onClick={() => setSidebarOpen(false)}/>
            )}

            {/* Sidebar */}
            <div className={`fixed md:relative z-50 md:z-auto w-72 md:w-64 h-full glass flex flex-col border-r border-white/5 transition-transform duration-300
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Clock size={14} /> Documents
                    </h2>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden p-1 text-gray-500 hover:text-white rounded">
                        <X size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                    {loading ? (
                        <div className="text-xs text-gray-500 p-2 animate-pulse">Loading...</div>
                    ) : documents.length === 0 ? (
                        <div className="text-xs text-gray-500 p-2">No documents uploaded yet.</div>
                    ) : (
                        documents.map((doc) => (
                            <div key={doc._id}
                                 className="group p-3 rounded-xl flex items-start gap-2.5 transition-all animate-fade-in"
                                 style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="mt-0.5 text-blue-400 shrink-0">
                                    <FileText size={15} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <a 
                                        href={`/uploads/${doc.filename}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-sm font-medium text-blue-400 hover:text-blue-300 truncate block transition-colors" 
                                        title={`Open ${doc.originalName}`}>
                                        {doc.originalName}
                                    </a>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor(doc.status) }}></span>
                                        <span className="text-xs text-gray-500">{doc.status}</span>
                                    </div>
                                </div>
                                {/* Delete always visible */}
                                <button
                                    onClick={() => handleDelete(doc._id, doc.originalName)}
                                    disabled={deletingId === doc._id}
                                    className="mt-0.5 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-50 shrink-0"
                                    title="Delete document">
                                    {deletingId === doc._id ? (
                                        <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={13} />
                                    )}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative min-w-0">
                <ChatWindow onUploadSuccess={fetchDocs} documents={documents} userEmail={userEmail} />
            </div>

            {/* Right Sidebar (History) */}
            <ChatHistory isOpen={historyOpen} setOpen={setHistoryOpen} />
        </div>
    );
};

export default ChatPage;

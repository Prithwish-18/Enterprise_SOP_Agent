import React, { useEffect, useState, useContext, useRef } from 'react';
import ChatWindow from '../components/ChatWindow';
import { getDocuments, deleteDocument, uploadSOP, deletePrivateDocumentsApi } from '../services/api';
import { FileText, Trash2, Loader2, Shield, Lock, Upload, X, PanelLeftClose, PanelLeft, AlertCircle } from 'lucide-react';
import { ChatContext } from '../context/ChatContext';
import shield from '../assets/shield.png';
import lock from "../assets/lock.png"

const StatusDot = ({ status }) => {
    const color = status === 'completed' ? '#a78bfa' : status === 'failed' ? '#f87171' : '#fbbf24';
    return <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5" style={{ background: color }} />;
};

const PrivateChatPage = () => {
    const { authToken, setPrivateMessages } = useContext(ChatContext);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const pollingRef = useRef(null);
    const authTokenRef = useRef(authToken);
    useEffect(() => { authTokenRef.current = authToken; }, [authToken]);

    const fetchDocs = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await getDocuments(authToken, 'private');
            setDocuments(data);
        } catch (err) {
            console.error('Failed to fetch private documents', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
        return () => {
            clearInterval(pollingRef.current);
            deletePrivateDocumentsApi(authTokenRef.current).catch(e => console.error('Private wipe failed:', e));
            setPrivateMessages([]);
        };
    }, []);

    useEffect(() => {
        clearInterval(pollingRef.current);
        if (documents.some(d => d.status === 'processing')) {
            pollingRef.current = setInterval(() => fetchDocs(true), 3000);
        }
        return () => clearInterval(pollingRef.current);
    }, [authToken, documents]);

    const handleFileUpload = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                await uploadSOP([file], authToken, 'private');
                fetchDocs(true);
            } catch (error) {
                console.error("Upload failed", error);
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const handleDelete = async (docId, name) => {
        if (!window.confirm(`Remove "${name}" from this private session?`)) return;
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
            style={{ background: 'radial-gradient(ellipse at 25% 0%, rgba(168,85,247,0.15),transparent 55%), radial-gradient(ellipse at 85% 90%, rgba(109,40,217,0.1),transparent 50%), #07030f' }}>

            {sidebarOpen && (
                <div className="lg:hidden absolute inset-0 z-40 bg-black/70 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={[
                'flex flex-col transition-all duration-300 shrink-0 z-50',
                'absolute lg:static top-0 left-0 h-full',
                'w-280px',
                sidebarVisible ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            ].join(' ')}
                style={{
                    background: 'linear-gradient(180deg,rgba(88,28,135,0.18) 0%,rgba(7,3,15,0.98) 100%)',
                    borderRight: '1px solid rgba(168,85,247,0.15)',
                }}>

                {/* Sidebar header */}
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center">
                            <img src={lock} className="h-12 w-12 object-contain" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-purple-300">Private Documents</span>
                    </div>
                    {/* close on mobile */}
                    <button onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1.5 text-purple-500 hover:text-white rounded-lg hover:bg-purple-500/10 transition-all">
                        <X size={15} />
                    </button>
                    <button onClick={() => setDesktopCollapsed(true)}
                        className="hidden lg:flex p-1.5 text-purple-600 hover:text-purple-300 rounded-lg hover:bg-purple-500/10 transition-all"
                        title="Collapse sidebar">
                        <PanelLeftClose size={15} />
                    </button>
                </div>

                {/* Security notice */}
                <div className="mx-3 mt-3 mb-1 flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)' }}>
                <div className="flex justify-center items-center">
                    <img src={shield} className="h-10 w-15 object-contain" />
                </div>                    
                    <p className="text-[10px] text-purple-400/70 leading-relaxed">Session-scoped, All documents wiped when you exit private mode</p>
                </div>

                {/* No-doc warning */}
                {!loading && documents.length === 0 && (
                    <div className="mx-3 mt-2 flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
                        <AlertCircle size={25} className="text-yellow-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-yellow-400/70 leading-relaxed">Upload a document first, Chat is restricted to document content only</p>
                    </div>
                )}

                {/* Document list */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin">
                    {loading ? (
                        <div className="flex items-center gap-2 text-xs text-purple-400/50 p-3 animate-pulse">
                            <Loader2 size={13} className="animate-spin" /> Loading . . .
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-10 text-center">
                            <input type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt"/>
                            <button onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className={`group flex flex-col items-center justify-center py-15 w-full rounded-2xl border border-dashed transition-all cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed border-purple-500/20 bg-purple-500/5' : 'border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-500/50'}`}>
                                <div className="w-20 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110" style={{ background: 'rgba(168,85,247,0.15)'}}>
                                    {isUploading ? <Loader2 size={20} className="text-purple-400 animate-spin" /> : <Upload size={20} className="text-purple-400" />}
                                </div>
                                <p className="text-sm font-semibold text-purple-300">{isUploading ? 'Uploading . . .' : 'Upload Document'}</p>
                                <p className="text-[11px] text-purple-400/60 mt-1">PDF, DOCX, TXT</p>
                            </button>
                        </div>
                    ) : (
                        documents.map(doc => (
                            <div key={doc._id}
                                className="group flex items-start gap-2.5 p-3 rounded-xl transition-all hover:bg-purple-500/8 animate-fade-in"
                                style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.12)' }}>
                                <FileText size={14} className="text-purple-400 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <a href={`${import.meta.env.VITE_API_URL || ''}/api/admin/documents/${doc._id}/download?token=${authToken}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="text-xs font-medium text-purple-200 hover:text-white truncate block transition-colors"
                                        title={doc.originalName}>
                                        {doc.originalName}
                                    </a>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <StatusDot status={doc.status} />
                                        <span className="text-[10px] capitalize text-purple-500/70">{doc.status}</span>
                                        {doc.status === 'processing' && <Loader2 size={9} className="animate-spin text-yellow-400" />}
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(doc._id, doc.originalName)}
                                    disabled={deletingId === doc._id}
                                    className="p-1.5 text-purple-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-40 opacity-0 group-hover:opacity-100 shrink-0">
                                    {deletingId === doc._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            <div className="flex-1 flex flex-col relative min-w-0">
                {/* Floating Docs pill */}
                <div className="absolute top-3 left-3 z-20 pointer-events-none">
                    <button onClick={() => {
                            if (window.innerWidth >= 1024) setDesktopCollapsed(false);
                            else setSidebarOpen(true);
                        }}
                        className={`pointer-events-auto items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-300 transition-all hover:text-white ${sidebarOpen ? 'hidden' : 'flex'} ${desktopCollapsed ? 'lg:flex' : 'lg:hidden'}`}
                        style={{ background: 'rgba(88,28,135,0.5)', border: '1px solid rgba(168,85,247,0.25)', backdropFilter: 'blur(10px)', boxShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                        <PanelLeft size={13} />
                        <span className="hidden sm:inline">Docs</span>
                        {documents.length > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(168,85,247,0.3)', color: '#d8b4fe' }}>{documents.length}</span>
                        )}
                    </button>
                </div>

                {/* Chat window */}
                <ChatWindow onUploadSuccess={fetchDocs}
                    documents={documents}
                    authToken={authToken}
                    activeSessionId="private"/>
            </div>
        </div>
    );
};

export default PrivateChatPage;

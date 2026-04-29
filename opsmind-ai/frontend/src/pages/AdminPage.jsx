import React, { useEffect, useState, useContext } from 'react';
import { ChatContext } from '../context/ChatContext';
import UploadPanel from '../components/UploadPanel';
import { getDocuments, deleteDocument } from '../services/api';
import { FileText, Trash2, Loader2, CheckCircle, AlertCircle, Clock, RefreshCw, Database, File, Zap, AlertTriangle } from 'lucide-react';

const AdminPage = () => {
    const { userEmail } = useContext(ChatContext);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const fetchDocs = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await getDocuments(userEmail);
            setDocuments(data);
        } catch (error) {
            console.error('Failed to fetch documents', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Initial fetch
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
        if (!window.confirm(`Delete "${docName}"?\n\nThis will permanently remove the document and all its indexed chunks.`)) {
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

    const handleDeleteAll = async () => {
        if (!window.confirm(`Are you sure you want to delete ALL documents?\n\nThis action cannot be undone and will permanently remove all SOPs.`)) {
            return;
        }
        setLoading(true);
        try {
            // Delete sequentially to avoid rate limiting or timeouts, or if there's a bulk API, use it.
            // Since we only have deleteDocument(id), we'll map over them.
            await Promise.all(documents.map(doc => deleteDocument(doc._id)));
            setDocuments([]);
        } catch (error) {
            console.error('Failed to delete all documents', error);
            alert('An error occurred while deleting some documents.');
            fetchDocs(); // Refresh to see what's left
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'completed':
                return { icon: <CheckCircle size={14} />, color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', label: 'Completed' };
            case 'failed':
                return { icon: <AlertCircle size={14} />, color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', label: 'Failed' };
            case 'processing':
                return { icon: <Loader2 size={14} className="animate-spin" />, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', label: 'Processing' };
            default:
                return { icon: <Clock size={14} />, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', label: status || 'Unknown' };
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    return (
        <div className="w-full h-full overflow-y-auto scrollbar-thin"
             style={{ background: 'radial-gradient(ellipse at 20% 0%, rgba(59,130,246,0.08), transparent 50%)' }}>
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Document Manager</h1>
                    <p className="text-gray-400 mt-1 text-sm sm:text-base">Upload and manage SOPs that power OpsMind's knowledge base</p>
                </div>

                {/* Upload Panel */}
                <UploadPanel onUploadSuccess={fetchDocs} userEmail={userEmail} />

                {/* Documents List */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <Database size={18} className="text-blue-400" />
                            <h3 className="text-base sm:text-lg font-semibold text-white">Indexed Documents</h3>
                            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{documents.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {documents.length > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 text-sm text-red-400 hover:text-white transition-colors disabled:opacity-50 px-3 py-1.5 rounded-lg hover:bg-red-500/20"
                                    title="Delete All Documents">
                                    <Trash2 size={14} />
                                    <span className="hidden sm:inline">Delete All</span>
                                </button>
                            )}
                            <button
                                onClick={fetchDocs}
                                disabled={loading}
                                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50 px-3 py-1.5 rounded-lg hover:bg-white/5">
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        {loading ? (
                            <div className="flex items-center gap-3 py-12 justify-center text-gray-500">
                                <Loader2 size={20} className="animate-spin" />
                                <span>Loading documents...</span>
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4">
                                    <FileText size={32} className="text-gray-600" />
                                </div>
                                <p className="text-gray-400 font-medium">No documents uploaded yet</p>
                                <p className="text-gray-600 text-sm mt-1">Upload your first SOP using the panel above.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {documents.map((doc) => {
                                    const status = getStatusConfig(doc.status);
                                    return (
                                        <div
                                            key={doc._id}
                                            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all animate-fade-in"
                                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            {/* Icon */}
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                                 style={{ background: 'rgba(59,130,246,0.1)' }}>
                                                <File size={18} className="text-blue-400" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <a 
                                                    href={`/uploads/${doc.filename}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block text-sm font-medium text-blue-300 hover:text-blue-400 hover:underline truncate cursor-pointer transition-colors" 
                                                    title={`View ${doc.originalName}`}>
                                                    {doc.originalName}
                                                </a>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                    <span className="text-xs text-gray-500">{formatDate(doc.createdAt || doc.uploadDate)}</span>
                                                    {doc.fileSize && <span className="text-xs text-gray-600">{formatSize(doc.fileSize)}</span>}
                                                    {doc.chunkCount > 0 && (
                                                        <span className="text-xs text-gray-600">
                                                            {`${doc.chunkCount} chunks`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                                                 style={{ color: status.color, background: status.bg, border: `1px solid ${status.border}` }}>
                                                {status.icon}
                                                <span className="hidden sm:inline">{status.label}</span>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDelete(doc._id, doc.originalName)}
                                                disabled={deletingId === doc._id}
                                                className="p-2 rounded-lg transition-all disabled:opacity-50 shrink-0 cursor-pointer hover:scale-105"
                                                style={{ color: '#94a3b8' }}
                                                title="Delete document"
                                                onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                {deletingId === doc._id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;

import React, { useState, useRef } from 'react';
import { Upload, FileUp, Loader2, CheckCircle, AlertCircle, X, File } from 'lucide-react';
import { uploadSOP } from '../services/api';

const UploadPanel = ({ onUploadSuccess, userEmail }) => {
    const [files, setFiles] = useState([]);
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    const addFiles = (newFiles) => {
        const arr = Array.from(newFiles);
        setFiles(prev => [...prev, ...arr]);
        setStatus('idle');
        setMessage('');
    };

    const handleFileChange = (e) => {
        if (e.target.files?.length) addFiles(e.target.files);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    };

    const removeFile = (idx) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setStatus('uploading');
        try {
            await uploadSOP(files, userEmail);
            setStatus('success');
            setMessage(`${files.length} document(s) uploaded & processing started!`);
            setFiles([]);
            if (inputRef.current) inputRef.current.value = '';
            if (onUploadSuccess) onUploadSuccess();
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Upload failed');
        }
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-white/5">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                    <FileUp size={18} className="text-blue-400" /> Upload SOPs
                </h3>
                <p className="text-sm text-gray-400 mt-1">Upload one or more files at once. PDF, DOCX, PPTX are only supported</p>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
                {/* Drop Zone */}
                <div
                    className="rounded-xl p-6 text-center transition-all cursor-pointer"
                    style={{
                        border: `2px dashed ${dragOver ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                        background: dragOver ? 'rgba(59,130,246,0.05)' : 'rgba(255,255,255,0.02)',
                    }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}>
                    <input
                        type="file"
                        ref={inputRef}
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}/>
                    <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3"
                         style={{ background: 'rgba(59,130,246,0.1)' }}>
                        <Upload size={22} className="text-blue-400" />
                    </div>
                    <div className="text-sm">
                        <span className="text-blue-400 font-medium">Click to browse</span>
                        <span className="text-gray-400"> or drag & drop multiple files</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">PDF, DOCX, PPTX • Max 10MB each</p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="space-y-2">
                        {files.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg animate-fade-in"
                                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <File size={16} className="text-blue-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-200 truncate">{file.name}</div>
                                    <div className="text-xs text-gray-500">{formatSize(file.size)}</div>
                                </div>
                                <button onClick={() => removeFile(idx)} className="p-1 text-gray-500 hover:text-gray-300 rounded shrink-0">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={handleUpload}
                            disabled={status === 'uploading'}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
                            {status === 'uploading' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            {status === 'uploading' ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
                        </button>
                    </div>
                )}

                {status === 'success' && (
                    <div className="p-3 rounded-xl flex items-center gap-2 text-sm animate-fade-in"
                         style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', color: '#34d399' }}>
                        <CheckCircle size={16} /> {message}
                    </div>
                )}
                {status === 'error' && (
                    <div className="p-3 rounded-xl flex items-center gap-2 text-sm animate-fade-in"
                         style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171' }}>
                        <AlertCircle size={16} /> {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadPanel;

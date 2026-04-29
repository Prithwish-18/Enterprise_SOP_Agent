import React from 'react';
import { BookOpen, FileText } from 'lucide-react';

const SourceViewer = ({ sources }) => {
    if (!sources || sources.length === 0) return null;

    // Deduplicate sources by document name + page
    const unique = [];
    const seen = new Set();
    sources.forEach(s => {
        const key = `${s.documentName}-${s.page}`;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(s);
        }
    });

    return (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                <BookOpen size={11} /> Sources
            </h4>
            <div className="flex flex-wrap gap-1.5">
                {unique.map((source, idx) => (
                    <div key={idx}
                         className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors"
                         style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', color: '#93c5fd' }}>
                        <FileText size={10} />
                        <span className="truncate max-w-150px">{source.documentName}</span>
                        <span style={{ color: '#64748b' }}>•</span>
                        <span>Pg {source.page}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SourceViewer;

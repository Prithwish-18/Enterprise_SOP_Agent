import React from 'react';
import { User, Bot, AlertTriangle } from 'lucide-react';
import SourceViewer from './SourceViewer';

const MessageBubble = ({ message }) => {
    const isUser = message.sender === 'user';
    const isError = message.text?.startsWith('Error:') || message.text?.startsWith('⏳') || message.text?.startsWith('⚠️') || message.text?.startsWith('🔑');

    // Simple markdown-like formatting
    const formatText = (text) => {
        if (!text) return null;
        
        return text.split('\n').map((line, i) => {
            // Bold text **text**
            let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Bullet points
            if (formatted.trim().startsWith('- ') || formatted.trim().startsWith('• ')) {
                formatted = '  • ' + formatted.trim().substring(2);
            }
            // Numbered lists
            const numMatch = formatted.trim().match(/^(\d+)\.\s/);
            if (numMatch) {
                formatted = `  ${numMatch[1]}. ` + formatted.trim().substring(numMatch[0].length);
            }
            
            return (
                <span key={i}>
                    <span dangerouslySetInnerHTML={{ __html: formatted }} />
                    {i < text.split('\n').length - 1 && <br />}
                </span>
            );
        });
    };

    return (
        <div className={`flex gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1"
                style={{ 
                    background: isUser 
                        ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                        : isError 
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: isUser 
                        ? '0 2px 10px rgba(59,130,246,0.3)' 
                        : '0 2px 10px rgba(99,102,241,0.3)'
                }}>
                {isUser ? <User size={15} className="text-white" /> : 
                 isError ? <AlertTriangle size={15} className="text-white" /> :
                 <Bot size={15} className="text-white" />}
            </div>

            {/* Content */}
            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`} style={{ maxWidth: isUser ? '75%' : '85%' }}>
                <div className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>
                    {isUser ? 'You' : 'OpsMind Agent'}
                </div>
                <div 
                    className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                    style={{
                        background: isUser 
                            ? 'rgba(59,130,246,0.1)' 
                            : isError 
                                ? 'rgba(245,158,11,0.08)'
                                : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${
                            isUser 
                                ? 'rgba(59,130,246,0.15)' 
                                : isError 
                                    ? 'rgba(245,158,11,0.15)'
                                    : 'rgba(255,255,255,0.06)'
                        }`,
                        color: isError ? '#fbbf24' : '#e2e8f0',
                        wordBreak: 'break-word',
                        borderTopRightRadius: isUser ? '6px' : '16px',
                        borderTopLeftRadius: isUser ? '16px' : '6px',
                    }}>
                    {message.text ? formatText(message.text) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic' }}>Generating response...</span>
                    )}
                </div>
                {!isUser && !isError && <SourceViewer sources={message.sources} />}
            </div>
        </div>
    );
};

export default MessageBubble;

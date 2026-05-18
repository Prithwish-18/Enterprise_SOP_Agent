import React from 'react';
import { User, Bot, AlertTriangle } from 'lucide-react';
import SourceViewer from './SourceViewer';
import user from '../assets/user.png';

const MessageBubble = ({ message }) => {
    const isUser = message.sender === 'user';
    const isError = message.text?.startsWith('Error:') || message.text?.startsWith('⏳') || message.text?.startsWith('⚠️') || message.text?.startsWith('🔑');

    // Simple markdown-like formatting
    const formatText = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            if (formatted.trim().startsWith('- ') || formatted.trim().startsWith('• ')) {
                formatted = '  • ' + formatted.trim().substring(2);
            }
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
        <div className={`flex gap-1.5 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1"
                style={{ 
                    background: "none",
                    boxShadow:"none"
                }}>
                {isUser ? <img src={user} className="w-12 h-12 object-cover"/> : 
                 isError ? <AlertTriangle size={25} className="text-red-500" /> :
                 <img src="/logo.png" className="w-9 h-9 object-cover"/>}
            </div>

            {/* Content */}
            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`} style={{ maxWidth: isUser ? '70%' : '70%' }}>
                <div className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>
                    {isUser ? 'You' : 'OpsMind Ai'}
                </div>
                <div 
                    className="rounded-2xl px-3 py-2 text-sm leading-relaxed"
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
                        <span style={{ color: '#64748b', fontStyle: 'italic' }}>Generating response . . .</span>
                    )}
                </div>
                {!isUser && !isError && <SourceViewer sources={message.sources} />}
            </div>
        </div>
    );
};

export default MessageBubble;

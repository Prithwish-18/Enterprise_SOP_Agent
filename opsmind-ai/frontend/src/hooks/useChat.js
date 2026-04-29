import { useContext } from 'react';
import { ChatContext } from '../context/ChatContext';
import { streamQueryResponse } from '../services/stream';

export const useChat = () => {
    const { 
        messages, addMessage, updateLastMessage, isTyping, setIsTyping, apiKey,
        sessions, activeSessionId, createNewSession, switchSession, deleteSession, clearAllSessions, renameSession
    } = useContext(ChatContext);

    const sendMessage = async (query) => {
        if (!query.trim()) return;

        addMessage({ id: Date.now(), text: query, sender: 'user' });
        setIsTyping(true);
        
        // Add empty AI message placeholder
        addMessage({ id: Date.now() + 1, text: '', sender: 'ai', sources: null });

        await streamQueryResponse(
            query,
            apiKey,
            (currentText, currentSources) => {
                updateLastMessage(currentText, currentSources);
            },
            (finalText, finalSources) => {
                updateLastMessage(finalText, finalSources);
                setIsTyping(false);
            },
            (err) => {
                updateLastMessage(`Error: ${err}`, null);
                setIsTyping(false);
            }
        );
    };

    return { 
        messages, isTyping, sendMessage,
        sessions, activeSessionId, createNewSession, switchSession, deleteSession, clearAllSessions, renameSession
    };
};

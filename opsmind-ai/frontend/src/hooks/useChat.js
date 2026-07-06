import { useContext } from 'react';
import { ChatContext } from '../context/ChatContext';
import { streamQueryResponse } from '../services/stream';

export const useChat = () => {
    const { 
        messages, addMessage, updateLastMessage, isTyping, setIsTyping, apiKey, authToken,
        sessions, activeSessionId, createNewSession, switchSession, deleteSession, clearAllSessions, renameSession,
        isPrivateMode, setIsPrivateMode, isDeepResearch, setIsDeepResearch, setPrivateMessages,
        masked, materializeGhost, pendingSessionRef,
        archivedIds, archiveSession, unarchiveSession
    } = useContext(ChatContext);

    const sendMessage = async (query) => {
        if (!query.trim()) return;

        addMessage({ id: Date.now(), text: query, sender: 'user' });
        setIsTyping(true);
        
        addMessage({ id: Date.now() + 1, text: '', sender: 'ai', sources: null });

        await streamQueryResponse(
            query,
            apiKey,
            authToken,
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
            },
            isPrivateMode,
            isDeepResearch,
            activeSessionId
        );
    };

    return { 
        messages, isTyping, sendMessage,
        sessions, activeSessionId, createNewSession, switchSession, deleteSession, clearAllSessions, renameSession,
        isPrivateMode, setIsPrivateMode, isDeepResearch, setIsDeepResearch, setPrivateMessages,
        masked, materializeGhost, pendingSessionRef,
        archivedIds, archiveSession, unarchiveSession
    };
};

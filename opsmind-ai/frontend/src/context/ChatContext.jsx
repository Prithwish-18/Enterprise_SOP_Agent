import { createContext, useState, useEffect } from 'react';
import { getSessions, createSession, updateSession, deleteSessionApi, clearAllSessionsApi } from '../services/api';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    // Auth state
    const [userEmail, setUserEmail] = useState(() => localStorage.getItem('opsmind_user_email') || null);
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('opsmind_gemini_key') || null);

    // Chat History State
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);

    // Fetch sessions from backend when user logs in
    useEffect(() => {
        const loadSessions = async () => {
            if (!userEmail) {
                setSessions([]);
                setIsLoadingSessions(false);
                return;
            }
            try {
                const data = await getSessions(userEmail);
                // map _id to id for frontend
                const formatted = data.map(s => ({ ...s, id: s._id }));
                setSessions(formatted);
                
                const savedActiveId = localStorage.getItem('opsmind_active_session');
                if (savedActiveId && formatted.find(s => s.id === savedActiveId)) {
                    setActiveSessionId(savedActiveId);
                } else if (formatted.length > 0) {
                    setActiveSessionId(formatted[0].id);
                } else {
                    createNewSession();
                }
            } catch (error) {
                console.error("Failed to load sessions:", error);
            } finally {
                setIsLoadingSessions(false);
            }
        };
        loadSessions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userEmail]);

    // Persist active session ID locally
    useEffect(() => {
        if (activeSessionId) localStorage.setItem('opsmind_active_session', activeSessionId);
    }, [activeSessionId]);

    const activeSession = sessions.find(s => s.id === activeSessionId) || { messages: [] };
    const messages = activeSession.messages || [];

    // Sync session to backend when AI finishes typing
    useEffect(() => {
        if (!isTyping && activeSessionId && sessions.length > 0) {
            const currentSession = sessions.find(s => s.id === activeSessionId);
            if (currentSession && currentSession.messages.length > 0) {
                updateSession(activeSessionId, { 
                    messages: currentSession.messages,
                    title: currentSession.title
                }).catch(err => console.error("Failed to sync session:", err));
            }
        }
    }, [isTyping, activeSessionId]); // Note: excluding sessions to avoid infinite loops, relying on state

    const createNewSession = async () => {
        if (!userEmail) return;
        try {
            const data = await createSession(userEmail, 'New Chat');
            const newSession = { ...data, id: data._id, messages: [] };
            setSessions(prev => [newSession, ...prev]);
            setActiveSessionId(newSession.id);
        } catch (error) {
            console.error("Failed to create session:", error);
        }
    };

    const switchSession = (id) => {
        if (isTyping) return; // Prevent switching while AI is generating
        setActiveSessionId(id);
    };
    
    const deleteSession = async (id) => {
        try {
            await deleteSessionApi(id);
            setSessions(prev => prev.filter(s => s.id !== id));
            if (activeSessionId === id) {
                const remaining = sessions.filter(s => s.id !== id);
                setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
                if (remaining.length === 0) createNewSession();
            }
        } catch (error) {
            console.error("Failed to delete session:", error);
        }
    };

    const clearAllSessions = async () => {
        if (!userEmail) return;
        if (window.confirm('Are you sure you want to delete all chat history?')) {
            try {
                await clearAllSessionsApi(userEmail);
                setSessions([]);
                setActiveSessionId(null);
                createNewSession();
            } catch (error) {
                console.error("Failed to clear sessions:", error);
            }
        }
    };

    const renameSession = async (id, newTitle) => {
        if (!newTitle.trim()) return;
        try {
            await updateSession(id, { title: newTitle });
            setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
        } catch (error) {
            console.error("Failed to rename session:", error);
        }
    };

    const login = (email) => {
        setUserEmail(email);
        localStorage.setItem('opsmind_user_email', email);
    };

    const saveApiKey = (key) => {
        setApiKey(key);
        localStorage.setItem('opsmind_gemini_key', key);
    };

    const logout = () => {
        setUserEmail(null);
        setApiKey(null);
        setSessions([]);
        setActiveSessionId(null);
        localStorage.removeItem('opsmind_user_email');
        localStorage.removeItem('opsmind_gemini_key');
        localStorage.removeItem('opsmind_active_session');
    };

    const addMessage = (message) => {
        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                let newTitle = s.title;
                if (s.messages.length === 0 && message.sender === 'user') {
                    newTitle = message.text.slice(0, 30) + (message.text.length > 30 ? '...' : '');
                }
                return { ...s, title: newTitle, messages: [...s.messages, message], updatedAt: Date.now() };
            }
            return s;
        }).sort((a, b) => b.updatedAt - a.updatedAt));
    };

    const updateLastMessage = (text, sources) => {
        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                const newMessages = [...s.messages];
                const lastIdx = newMessages.length - 1;
                if (lastIdx >= 0 && newMessages[lastIdx].sender === 'ai') {
                    newMessages[lastIdx] = { 
                        ...newMessages[lastIdx], 
                        text: text, 
                        sources: sources || newMessages[lastIdx].sources 
                    };
                }
                return { ...s, messages: newMessages, updatedAt: Date.now() };
            }
            return s;
        }));
    };

    return (
        <ChatContext.Provider value={{ 
            messages, addMessage, updateLastMessage, isTyping, setIsTyping,
            sessions, activeSessionId, createNewSession, switchSession, deleteSession,
            clearAllSessions, renameSession, isLoadingSessions,
            userEmail, apiKey, login, saveApiKey, logout
        }}>
            {children}
        </ChatContext.Provider>
    );
};

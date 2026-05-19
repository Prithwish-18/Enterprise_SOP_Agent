import { createContext, useState, useEffect, useRef } from 'react';
import { getSessions, createSession, updateSession, deleteSessionApi, clearAllSessionsApi, sendHeartbeat } from '../services/api';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [userEmail, setUserEmail] = useState(() => localStorage.getItem('opsmind_user_email') || null);
    const [authToken, setAuthToken] = useState(() => localStorage.getItem('opsmind_token') || null);
    const [isPrivateMode, setIsPrivateMode] = useState(() => sessionStorage.getItem('opsmind_private_mode') === 'true');
    const [privateMessages, setPrivateMessages] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem('opsmind_private_messages') || '[]'); } catch { return []; }
    });
    const [masked, setMasked] = useState(() => sessionStorage.getItem('opsmind_private_masked') === 'true');
    const [lockPassword, setLockPassword] = useState(() => sessionStorage.getItem('opsmind_private_lock_password') || '');
    const [lockAttempts, setLockAttempts] = useState(() => parseInt(sessionStorage.getItem('opsmind_private_lock_attempts') || '0'));
    const [isDeepResearch, setIsDeepResearch] = useState(false);
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('opsmind_gemini_key') || null);
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [archivedIds, setArchivedIds] = useState(() => {
        try { return JSON.parse(localStorage.getItem('opsmind_archived_chats') || '[]'); } catch { return []; }
    });

    const archiveSession = (sessionId) => {
        const updated = [...archivedIds, sessionId];
        setArchivedIds(updated);
        localStorage.setItem('opsmind_archived_chats', JSON.stringify(updated));
    };

    const unarchiveSession = (sessionId) => {
        const updated = archivedIds.filter(id => id !== sessionId);
        setArchivedIds(updated);
        localStorage.setItem('opsmind_archived_chats', JSON.stringify(updated));
    };
    const heartbeatRef = useRef(null);
    useEffect(() => {
        if (!authToken) { clearInterval(heartbeatRef.current); return; }
        const ua = navigator.userAgent;
        let os = 'Unknown';
        if (/Windows/.test(ua)) os = 'Windows';
        else if (/Mac OS X/.test(ua)) os = 'macOS';
        else if (/Android/.test(ua)) os = 'Android';
        else if (/iPhone|iPad/.test(ua)) os = 'iOS';
        else if (/Linux/.test(ua)) os = 'Linux';
        let browser = 'Unknown';
        if (/Edg\//.test(ua)) browser = 'Edge';
        else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
        else if (/Firefox\//.test(ua)) browser = 'Firefox';
        else if (/Safari\//.test(ua)) browser = 'Safari';
        let deviceType = 'PC';
        if (/Mobi|Android/.test(ua) && !/Tablet|iPad/.test(ua)) deviceType = 'Mobile';
        else if (/Tablet|iPad/.test(ua)) deviceType = 'Tablet';
        const deviceInfo = { os, browser, deviceType };
        sendHeartbeat(authToken, deviceInfo); 
        heartbeatRef.current = setInterval(() => sendHeartbeat(authToken, deviceInfo), 30000);
        return () => clearInterval(heartbeatRef.current);
    }, [authToken]);
    const pendingSessionRef = useRef(null);
    useEffect(() => {
        const loadSessions = async () => {
            if (!userEmail || !authToken) {
                setSessions([]);
                setIsLoadingSessions(false);
                return;
            }
            try {
                const data = await getSessions(authToken);
                const formatted = data
                    .map(s => ({ ...s, id: s._id }))
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                setSessions(formatted);
                const justLoggedIn = localStorage.getItem('opsmind_just_logged_in');
                if (justLoggedIn === 'true') {
                    localStorage.removeItem('opsmind_just_logged_in');
                }
                const ghostId = 'ghost-' + Date.now();
                const ghost = { id: ghostId, _id: ghostId, title: 'New Chat', messages: [], updatedAt: new Date().toISOString(), isGhost: true };
                pendingSessionRef.current = ghostId;
                setSessions(prev => [ghost, ...prev]);
                setActiveSessionId(ghostId);
            } catch (error) {
                console.error("Failed to load sessions:", error);
            } finally {
                setIsLoadingSessions(false);
            }
        };
        loadSessions();
    }, [userEmail, authToken]);

    const materializeGhost = async () => {
        const ghostId = pendingSessionRef.current;
        if (!ghostId) return null;
        try {
            const data = await createSession('New Chat', authToken);
            const realSession = { ...data, id: data._id, messages: [] };
            setSessions(prev => prev.map(s => s.id === ghostId ? realSession : s));
            setActiveSessionId(realSession.id);
            pendingSessionRef.current = null;
            return realSession.id;
        } catch (e) {
            console.error('Failed to materialize ghost session:', e);
            return null;
        }
    };

    const discardGhost = (ghostId) => {
        pendingSessionRef.current = null;
        setSessions(prev => prev.filter(s => s.id !== ghostId));
    };

    useEffect(() => {
        if (activeSessionId) localStorage.setItem('opsmind_active_session', activeSessionId);
    }, [activeSessionId]);

    const activeSession = sessions.find(s => s.id === activeSessionId) || { messages: [] };
    const messages = isPrivateMode ? privateMessages : (activeSession.messages || []);

    useEffect(() => {
        if (!isTyping && activeSessionId && sessions.length > 0) {
            const currentSession = sessions.find(s => s.id === activeSessionId);
            if (currentSession && currentSession.messages.length > 0) {
                updateSession(activeSessionId, { 
                    messages: currentSession.messages,
                    title: currentSession.title
                }, authToken).catch(err => console.error("Failed to sync session:", err));
            }
        }
    }, [isTyping, activeSessionId]);

    const createNewSession = async () => {
        if (!userEmail || !authToken) return;
        if (pendingSessionRef.current) {
            const ghostStillExists = sessions.find(s => s.id === pendingSessionRef.current);
            if (ghostStillExists) {
                setIsPrivateMode(false);
                setActiveSessionId(pendingSessionRef.current);
                return;
            }
        }
        const ghostId = 'ghost-' + Date.now();
        const ghost = { id: ghostId, _id: ghostId, title: 'New Chat', messages: [], updatedAt: new Date().toISOString(), isGhost: true };
        pendingSessionRef.current = ghostId;
        setSessions(prev => [ghost, ...prev]);
        setIsPrivateMode(false);
        setActiveSessionId(ghostId);
    };

    const switchSession = (id) => {
        if (isTyping) return;
        if (pendingSessionRef.current && pendingSessionRef.current !== id) {
            discardGhost(pendingSessionRef.current);
        }
        setIsPrivateMode(false);
        setActiveSessionId(id);
        setSessions(prev => prev.map(s => s.id === id ? { ...s, updatedAt: new Date().toISOString() } : s)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    };
    
    const deleteSession = async (id) => {
        try {
            await deleteSessionApi(id, authToken);
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
        if (!userEmail || !authToken) return;
        if (window.confirm('Are you sure you want to delete all chat history?')) {
            try {
                await clearAllSessionsApi(authToken);
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
            await updateSession(id, { title: newTitle }, authToken);
            setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
        } catch (error) {
            console.error("Failed to rename session:", error);
        }
    };

    const login = (email, token) => {
        setUserEmail(email);
        setAuthToken(token);
        localStorage.setItem('opsmind_user_email', email);
        localStorage.setItem('opsmind_token', token);
        localStorage.setItem('opsmind_just_logged_in', 'true');
        try {
            const ua = navigator.userAgent;
            let os = 'Unknown OS';
            if (/Windows/.test(ua)) os = 'Windows';
            else if (/Mac OS X/.test(ua)) os = 'macOS';
            else if (/Android/.test(ua)) os = 'Android';
            else if (/iPhone|iPad/.test(ua)) os = 'iOS';
            else if (/Linux/.test(ua)) os = 'Linux';
            let browser = 'Unknown';
            if (/Edg\//.test(ua)) browser = 'Microsoft Edge';
            else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
            else if (/Firefox\//.test(ua)) browser = 'Firefox';
            else if (/Safari\//.test(ua)) browser = 'Safari';
            let deviceType = 'PC';
            if (/Mobi|Android/.test(ua)) deviceType = 'Mobile';
            else if (/Tablet|iPad/.test(ua)) deviceType = 'Tablet';
            const sessionId = 'login-' + Date.now();
            const existing = JSON.parse(localStorage.getItem('opsmind_device_sessions') || '[]');
            const updated = [{ id: sessionId, os, browser, deviceType, timestamp: Date.now(), isCurrent: false }, ...existing].slice(0, 5);
            localStorage.setItem('opsmind_device_sessions', JSON.stringify(updated));
        } catch (e) { /* non-critical */ }
    };

    const saveApiKey = (key) => {
        setApiKey(key);
        localStorage.setItem('opsmind_gemini_key', key);
    };

    useEffect(() => {
        sessionStorage.setItem('opsmind_private_mode', isPrivateMode);
    }, [isPrivateMode]);

    useEffect(() => {
        sessionStorage.setItem('opsmind_private_messages', JSON.stringify(privateMessages));
    }, [privateMessages]);

    useEffect(() => {
        sessionStorage.setItem('opsmind_private_masked', masked);
    }, [masked]);

    useEffect(() => {
        sessionStorage.setItem('opsmind_private_lock_password', lockPassword);
    }, [lockPassword]);

    useEffect(() => {
        sessionStorage.setItem('opsmind_private_lock_attempts', lockAttempts);
    }, [lockAttempts]);

    const logout = () => {
        setUserEmail(null);
        setAuthToken(null);
        setApiKey(null);
        setSessions([]);
        setActiveSessionId(null);
        setIsPrivateMode(false);
        setPrivateMessages([]);
        setMasked(false);
        setLockPassword('');
        setLockAttempts(0);
        localStorage.removeItem('opsmind_user_email');
        localStorage.removeItem('opsmind_token');
        localStorage.removeItem('opsmind_gemini_key');
        localStorage.removeItem('opsmind_active_session');
        localStorage.removeItem('opsmind_device_sessions');
        sessionStorage.clear();
    };

    useEffect(() => {
        const handleAuthError = () => {
            alert('Your session has expired or is invalid. Please log in again.');
            logout();
        };
        window.addEventListener('auth_error', handleAuthError);
        return () => window.removeEventListener('auth_error', handleAuthError);
    }, []);

    const addMessage = (message) => {
        if (isPrivateMode) {
            setPrivateMessages(prev => [...prev, message]);
            return;
        }

        if (pendingSessionRef.current && pendingSessionRef.current === activeSessionId) {
            materializeGhost().then(realId => {
                if (!realId) return;
                setSessions(prev => prev.map(s => {
                    if (s.id === realId) {
                        const newTitle = message.sender === 'user'
                            ? message.text.slice(0, 30) + (message.text.length > 30 ? '...' : '')
                            : s.title;
                        return { ...s, title: newTitle, messages: [...s.messages, message], updatedAt: new Date().toISOString() };
                    }
                    return s;
                }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
            });
            return;
        }

        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                let newTitle = s.title;
                if (s.messages.length === 0 && message.sender === 'user') {
                    newTitle = message.text.slice(0, 30) + (message.text.length > 30 ? '...' : '');
                }
                return { ...s, title: newTitle, messages: [...s.messages, message], updatedAt: new Date().toISOString() };
            }
            return s;
        }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    };

    const importSharedSession = async (title, sharedMessages) => {
        if (!userEmail || !authToken) return null;
        try {
            const newSession = await createSession(title, authToken);
            const realId = newSession.id || newSession._id;
            await updateSession(realId, { messages: sharedMessages }, authToken);
            const data = await getSessions(authToken);
            const formatted = data
                .map(s => ({ ...s, id: s._id }))
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            setSessions(formatted);
            setIsPrivateMode(false);
            setActiveSessionId(realId);
            return realId;
        } catch (error) {
            console.error("Failed to import shared session:", error);
            throw error;
        }
    };

    const updateLastMessage = (text, sources) => {
        if (isPrivateMode) {
            setPrivateMessages(prev => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                if (lastIdx >= 0) {
                    newMessages[lastIdx] = { ...newMessages[lastIdx], text, sources };
                }
                return newMessages;
            });
            return;
        }

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
            userEmail, authToken, apiKey, login, saveApiKey, logout,
            isPrivateMode, setIsPrivateMode, isDeepResearch, setIsDeepResearch, setPrivateMessages,
            masked, setMasked, lockPassword, setLockPassword, lockAttempts, setLockAttempts,
            materializeGhost, pendingSessionRef, importSharedSession,
            archivedIds, archiveSession, unarchiveSession
        }}>
            {children}
        </ChatContext.Provider>
    );
};

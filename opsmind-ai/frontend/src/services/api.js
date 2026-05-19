const BASE_URL = import.meta.env.VITE_API_URL || '';

const getAuthHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
});

const handleResponseErrors = async (response, defaultError) => {
    if (response.status === 401) {
        window.dispatchEvent(new Event('auth_error'));
    }
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || defaultError);
    }
};

export const uploadSOP = async (files, token, sessionId) => {
    const formData = new FormData();
    if (sessionId) {
        formData.append('sessionId', sessionId);
    }
    const fileList = Array.isArray(files) ? files : [files];
    fileList.forEach(file => {
        formData.append('document', file);
    });
    const apiKey = localStorage.getItem('opsmind_gemini_key') || '';
    const effectiveKey = (apiKey && apiKey !== '__USE_SERVER_KEY__') ? apiKey : '';
    const response = await fetch(`${BASE_URL}/api/admin/upload`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'x-gemini-api-key': effectiveKey 
        },
        body: formData,
    });
    await handleResponseErrors(response, 'Upload failed');
    return response.json();
};

export const getDocuments = async (token, sessionId) => {
    const url = sessionId ? `${BASE_URL}/api/admin/documents?sessionId=${sessionId}` : `${BASE_URL}/api/admin/documents`;
    const response = await fetch(url, {
        headers: getAuthHeaders(token),
    });
    await handleResponseErrors(response, 'Failed to fetch documents');
    return response.json();
};

export const deleteDocument = async (docId, token) => {
    const response = await fetch(`${BASE_URL}/api/admin/documents/${docId}`, { 
        method: 'DELETE',
        headers: getAuthHeaders(token),
    });
    await handleResponseErrors(response, 'Failed to delete document');
    return response.json();
};

export const getSessions = async (token) => {
    const response = await fetch(`${BASE_URL}/api/chat/sessions`, {
        headers: getAuthHeaders(token),
    });
    await handleResponseErrors(response, 'Failed to fetch sessions');
    return response.json();
};

export const createSession = async (title = 'New Chat', token) => {
    const response = await fetch(`${BASE_URL}/api/chat/sessions`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ title })
    });
    await handleResponseErrors(response, 'Failed to create session');
    return response.json();
};

export const updateSession = async (id, data, token) => {
    const response = await fetch(`${BASE_URL}/api/chat/sessions/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data)
    });
    await handleResponseErrors(response, 'Failed to update session');
    return response.json();
};

export const deleteSessionApi = async (id, token) => {
    const response = await fetch(`${BASE_URL}/api/chat/sessions/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders(token),
    });
    await handleResponseErrors(response, 'Failed to delete session');
    return response.json();
};

export const clearAllSessionsApi = async (token) => {
    const response = await fetch(`${BASE_URL}/api/chat/sessions`, { 
        method: 'DELETE',
        headers: getAuthHeaders(token),
    });
    await handleResponseErrors(response, 'Failed to clear sessions');
    return response.json();
};

export const signupUser = async (name, email, password) => {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Signup failed');
    }
    return response.json();
};

export const loginUser = async (email, password) => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Login failed');
    }
    return response.json();
};

export const updateProfileUser = async (name, oldPassword, newPassword, apiKey, token) => {
    const response = await fetch(`${BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ name, oldPassword, newPassword, apiKey })
    });
    await handleResponseErrors(response, 'Profile update failed');
    return response.json();
};

export const deleteAllDocumentsApi = async (token) => {
    const response = await fetch(`${BASE_URL}/api/admin/documents`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
    });
    await handleResponseErrors(response, 'Delete all documents failed');
    return response.json();
};

export const deletePrivateDocumentsApi = async (token) => {
    const response = await fetch(`${BASE_URL}/api/admin/documents/private`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
    });
    await handleResponseErrors(response, 'Delete private documents failed');
    return response.json();
};

export const sendHeartbeat = async (token, deviceInfo) => {
    const doSend = () =>
        fetch(`${BASE_URL}/api/auth/sessions/heartbeat`, {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(deviceInfo),
        });
    try {
        const res = await doSend();
        if (res.status >= 500) {
            await new Promise(r => setTimeout(r, 2000));
            await doSend();
        }
    } catch (err) {
        
        try {
            await new Promise(r => setTimeout(r, 2000));
            await doSend();
        } catch (_) { /* silent after retry */ }
    }
};


/** Fetch all active device sessions for the logged-in user */
export const getActiveSessions = async (token) => {
    const response = await fetch(`${BASE_URL}/api/auth/sessions`, {
        headers: getAuthHeaders(token),
    });
    await handleResponseErrors(response, 'Failed to fetch sessions');
    return response.json();
};

export const revokeSession = async (sessionId, token) => {
    const response = await fetch(`${BASE_URL}/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
    });
    await handleResponseErrors(response, 'Failed to revoke session');
    return response.json();
};

export const getSharedSession = async (sessionId) => {
    const response = await fetch(`${BASE_URL}/api/chat/sessions/share/${sessionId}`);
    await handleResponseErrors(response, 'Failed to fetch shared session');
    return response.json();
};


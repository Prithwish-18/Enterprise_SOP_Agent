const BASE_URL = import.meta.env.VITE_API_URL || '';

export const uploadSOP = async (files, email) => {
    const formData = new FormData();
    
    // Support single file or array of files
    const fileList = Array.isArray(files) ? files : [files];
    fileList.forEach(file => {
        formData.append('document', file);
    });
    
    if (email) {
        formData.append('email', email);
    }
    
    const apiKey = localStorage.getItem('opsmind_gemini_key') || '';
    const effectiveKey = (apiKey && apiKey !== '__USE_SERVER_KEY__') ? apiKey : '';

    const response = await fetch(`${BASE_URL}/api/admin/upload`, {
        method: 'POST',
        headers: { 'x-gemini-api-key': effectiveKey },
        body: formData,
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
    }
    
    return response.json();
};

export const getDocuments = async (email) => {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const response = await fetch(`${BASE_URL}/api/admin/documents${query}`);
    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
};

export const deleteDocument = async (docId, email) => {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const response = await fetch(`${BASE_URL}/api/admin/documents/${docId}${query}`, { method: 'DELETE' });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete document');
    }
    return response.json();
};

export const getSessions = async (email) => {
    if (!email) return [];
    const response = await fetch(`${BASE_URL}/api/chat/sessions?email=${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return response.json();
};

export const createSession = async (email, title = 'New Chat') => {
    if (!email) throw new Error('Email required to create session');
    const response = await fetch(`${BASE_URL}/api/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, title })
    });
    if (!response.ok) throw new Error('Failed to create session');
    return response.json();
};

export const updateSession = async (id, data) => {
    const response = await fetch(`${BASE_URL}/api/chat/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update session');
    return response.json();
};

export const deleteSessionApi = async (id) => {
    const response = await fetch(`${BASE_URL}/api/chat/sessions/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete session');
    return response.json();
};

export const clearAllSessionsApi = async (email) => {
    if (!email) throw new Error('Email required');
    const response = await fetch(`${BASE_URL}/api/chat/sessions?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to clear sessions');
    return response.json();
};

export const signupUser = async (name, email, password) => {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Signup failed');
    return data;
};

export const loginUser = async (email, password) => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    return data;
};

export const updateProfileUser = async (email, name, oldPassword, newPassword, apiKey) => {
    const response = await fetch(`${BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, oldPassword, newPassword, apiKey })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Profile update failed');
    return data;
};

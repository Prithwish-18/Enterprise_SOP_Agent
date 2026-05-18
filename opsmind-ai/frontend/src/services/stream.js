const BASE_URL = import.meta.env.VITE_API_URL || '';

export const streamQueryResponse = async (query, apiKey, token, onUpdate, onComplete, onError, isPrivate = false, isDeepResearch = false, sessionId = null) => {
    try {
        const effectiveKey = (apiKey && apiKey !== '__USE_SERVER_KEY__') ? apiKey : '';
        const response = await fetch(`${BASE_URL}/api/query/stream`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-gemini-api-key': effectiveKey
            },
            body: JSON.stringify({ query, isPrivate, isDeepResearch, sessionId })
        });
        if (response.status === 401) {
            window.dispatchEvent(new Event('auth_error'));
        }
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to connect to the server');
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let sources = null;
        let buffer = ""; 

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
    
            buffer = lines.pop() || "";
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6);
                    if (!dataStr) continue;
                    try {
                        const data = JSON.parse(dataStr);
                        if (data.done) {
                            onComplete(fullText, sources);
                            return;
                        }
                        if (data.error) {
                            onError(data.error);
                            return;
                        }
                        if (data.text) {
                            if (data.text.includes('__SOURCES__')) {
                                const parts = data.text.split('__SOURCES__');
                                const textPart = parts[0].replace(/\n+$/, '');
                                if (textPart) {
                                    fullText += textPart;
                                }
                                try {
                                    sources = JSON.parse(parts[1]);
                                } catch(e) {
                                    console.warn("Could not parse sources", e);
                                }
                            } else {
                                fullText += data.text;
                            }
                            onUpdate(fullText, sources);
                        }
                    } catch (e) {
                        console.error("Parse error in stream", e);
                    }
                }
            }
        }

        if (buffer.startsWith('data: ')) {
            try {
                const data = JSON.parse(buffer.slice(6));
                if (data.done) {
                    onComplete(fullText, sources);
                    return;
                }
            } catch(e) {}
        }
        onComplete(fullText, sources);
    } catch (err) {
        onError(err.message || 'Connection error');
    }
};

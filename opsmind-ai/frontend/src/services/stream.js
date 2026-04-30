const BASE_URL = import.meta.env.VITE_API_URL || '';

export const streamQueryResponse = async (query, apiKey, onUpdate, onComplete, onError) => {
    try {
        // Don't send placeholder keys to the server
        const effectiveKey = (apiKey && apiKey !== '__USE_SERVER_KEY__') ? apiKey : '';

        const response = await fetch(`${BASE_URL}/api/query/stream`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-gemini-api-key': effectiveKey
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to connect to the server');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let sources = null;
        let buffer = ""; // Buffer for handling partial SSE messages

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            
            // Keep the last potentially incomplete chunk in buffer
            buffer = lines.pop() || "";
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6); // More reliable than replace
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
                                // Add any text before the marker
                                const textPart = parts[0].replace(/\n+$/, ''); // Remove trailing newlines
                                if (textPart) {
                                    fullText += textPart;
                                }
                                // Parse sources JSON
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

        // Process any remaining buffer
        if (buffer.startsWith('data: ')) {
            try {
                const data = JSON.parse(buffer.slice(6));
                if (data.done) {
                    onComplete(fullText, sources);
                    return;
                }
            } catch(e) {}
        }

        // If we get here without a done signal, still complete
        onComplete(fullText, sources);
    } catch (err) {
        onError(err.message || 'Connection error');
    }
};

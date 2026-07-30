const AI = (() => {
    let isGenerating = false;

    async function callAPI(messages, onChunk = null) {
        const settings = Storage.getSettings();
        if (!settings.apiKey) {
            throw new Error('API key not configured. Open Settings to add your OpenAI API key.');
        }

        const endpoint = (settings.apiEndpoint || 'https://api.openai.com/v1').replace(/\/+$/, '');
        const url = `${endpoint}/chat/completions`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiKey}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000,
                stream: !!onChunk
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `API error: ${response.status}`);
        }

        if (onChunk) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let result = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
                for (const line of lines) {
                    const data = line.slice(6);
                    if (data === '[DONE]') break;
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            result += content;
                            onChunk(result);
                        }
                    } catch {}
                }
            }
            return result;
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    async function chat(userMessage, noteContent = '') {
        if (isGenerating) return;
        isGenerating = true;

        const settings = Storage.getSettings();
        const systemPrompt = settings.systemPrompt || 'You are a helpful AI assistant.';

        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        if (noteContent) {
            messages.push({
                role: 'system',
                content: `The user's current note content:\n\n${noteContent.substring(0, 4000)}`
            });
        }

        messages.push({ role: 'user', content: userMessage });

        try {
            const result = await callAPI(messages);
            isGenerating = false;
            return result;
        } catch (err) {
            isGenerating = false;
            throw err;
        }
    }

    async function aiAction(action, content, onChunk = null) {
        if (isGenerating) return;
        isGenerating = true;

        const settings = Storage.getSettings();
        const systemPrompt = settings.systemPrompt || 'You are a helpful AI assistant.';

        const prompts = {
            summarize: `Summarize the following text concisely, keeping key points:\n\n${content}`,
            expand: `Expand the following text with more detail, examples, and depth:\n\n${content}`,
            grammar: `Fix all grammar, spelling, and punctuation errors in this text. Return only the corrected text with no explanation:\n\n${content}`,
            translate: `Translate the following text to English (or if it's already in English, translate to Spanish). Return only the translation:\n\n${content}`,
            rewrite: `Rewrite the following text to be clearer and more engaging while keeping the same meaning:\n\n${content}`
        };

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompts[action] || prompts.rewrite }
        ];

        try {
            const result = await callAPI(messages, onChunk);
            isGenerating = false;
            return result;
        } catch (err) {
            isGenerating = false;
            throw err;
        }
    }

    function isBusy() {
        return isGenerating;
    }

    return { chat, aiAction, isBusy };
})();

const Chatbot = (() => {
    let conversationHistory = [];
    let isGenerating = false;

    function init() {
        const sendBtn = document.getElementById('chatSendBtn');
        const input = document.getElementById('chatInput');
        const closeBtn = document.getElementById('chatCloseBtn');
        const backBtn = document.getElementById('chatBackBtn');

        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            input.addEventListener('input', () => {
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 120) + 'px';
            });
        }
        if (closeBtn) closeBtn.addEventListener('click', closeChatbot);
        if (backBtn) backBtn.addEventListener('click', closeChatbot);

        document.querySelectorAll('.chat-suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById('chatInput');
                input.value = btn.textContent;
                sendMessage();
            });
        });
    }

    function open() {
        const screen = document.getElementById('chatbotScreen');
        if (screen) {
            screen.classList.add('active');
            document.getElementById('chatInput').focus();
        }
    }

    function closeChatbot() {
        const screen = document.getElementById('chatbotScreen');
        if (screen) screen.classList.remove('active');
    }

    function addMessage(role, content) {
        const container = document.getElementById('chatMessages');
        if (!container) return null;

        const div = document.createElement('div');
        div.className = `chat-msg ${role}`;

        if (role === 'assistant') {
            div.innerHTML = `
                <div class="chat-msg-avatar">
                    <span class="chat-ai-icon">✦</span>
                </div>
                <div class="chat-msg-body">
                    <div class="chat-msg-name">Limo.ai</div>
                    <div class="chat-msg-content">${formatChatMessage(content)}</div>
                </div>
            `;
        } else {
            const user = Auth.getUser();
            const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();
            div.innerHTML = `
                <div class="chat-msg-body user-body">
                    <div class="chat-msg-name">You</div>
                    <div class="chat-msg-content">${escapeChatHtml(content)}</div>
                </div>
                <div class="chat-msg-avatar user-avatar">
                    <span>${initial}</span>
                </div>
            `;
        }

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return div;
    }

    async function sendMessage() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text || isGenerating) return;

        input.value = '';
        input.style.height = 'auto';

        addMessage('user', text);
        conversationHistory.push({ role: 'user', content: text });

        const loading = addMessage('assistant', '<span class="chat-typing"><span></span><span></span><span></span></span>');
        isGenerating = true;

        try {
            const messages = [
                {
                    role: 'system',
                    content: 'You are Limo.ai, a helpful AI assistant inside a notebook app. Be concise, helpful, and creative. You can help with writing, brainstorming, summarizing, translating, and answering questions.'
                },
                ...conversationHistory.slice(-20)
            ];

            let response = '';
            const settings = Storage.getSettings();

            if (!settings.apiKey) {
                throw new Error('OpenAI API Key not configured. Go to Settings to add your API key.');
            }

            const endpoint = (settings.apiEndpoint || 'https://api.openai.com/v1').replace(/\/+$/, '');
            const result = await streamChat(endpoint, settings.apiKey, settings.model, messages, (partial) => {
                response = partial;
                if (loading) {
                    loading.querySelector('.chat-msg-content').innerHTML = formatChatMessage(response);
                    document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
                }
            });

            conversationHistory.push({ role: 'assistant', content: response });
        } catch (err) {
            if (loading) {
                loading.querySelector('.chat-msg-content').innerHTML = `<span class="chat-error">${escapeChatHtml(err.message)}</span>`;
            }
        } finally {
            isGenerating = false;
        }
    }

    async function streamChat(endpoint, apiKey, model, messages, onChunk) {
        const response = await fetch(`${endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'gpt-4o',
                messages: messages,
                temperature: 0.7,
                max_tokens: 4000,
                stream: true
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `API error: ${response.status}`);
        }

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

    function clearConversation() {
        conversationHistory = [];
        const container = document.getElementById('chatMessages');
        if (container) {
            container.innerHTML = `
                <div class="chat-welcome">
                    <div class="chat-welcome-icon">✦</div>
                    <h3>Hello! I'm Limo.ai</h3>
                    <p>Your AI assistant. Ask me anything — writing, brainstorming, translation, and more.</p>
                    <div class="chat-suggestions">
                        <button class="chat-suggestion-btn">Help me write a story</button>
                        <button class="chat-suggestion-btn">Summarize my notes</button>
                        <button class="chat-suggestion-btn">Translate to Spanish</button>
                        <button class="chat-suggestion-btn">Brainstorm ideas</button>
                    </div>
                </div>
            `;
            container.querySelectorAll('.chat-suggestion-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.getElementById('chatInput').value = btn.textContent;
                    sendMessage();
                });
            });
        }
    }

    function formatChatMessage(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/\n/g, '<br>');
    }

    function escapeChatHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { init, open, closeChatbot, sendMessage, clearConversation };
})();

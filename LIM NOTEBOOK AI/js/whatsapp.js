const WhatsApp = (() => {
    const CONTACTS_KEY = 'limo_wa_contacts';
    const MESSAGES_KEY = 'limo_wa_messages';

    function getContacts() {
        try { return JSON.parse(localStorage.getItem(CONTACTS_KEY)) || []; }
        catch { return []; }
    }

    function saveContacts(contacts) {
        localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
    }

    function getMessages() {
        try { return JSON.parse(localStorage.getItem(MESSAGES_KEY)) || []; }
        catch { return []; }
    }

    function saveMessages(msgs) {
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
    }

    function addContact(name, phone, code) {
        const contacts = getContacts();
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
        contacts.push({ id, name, phone, code });
        saveContacts(contacts);
        return contacts;
    }

    function removeContact(id) {
        let contacts = getContacts();
        contacts = contacts.filter(c => c.id !== id);
        saveContacts(contacts);
        return contacts;
    }

    function logMessage(to, text) {
        const msgs = getMessages();
        msgs.unshift({
            id: Date.now().toString(36),
            to,
            text: text.substring(0, 200),
            timestamp: new Date().toISOString()
        });
        if (msgs.length > 50) msgs.pop();
        saveMessages(msgs);
    }

    function sendToWhatsApp(phone, code, text) {
        const clean = phone.replace(/\D/g, '');
        const full = code.replace('+', '') + clean;
        const url = `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }

    function sendToGroup(text) {
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => true).catch(() => false);
    }

    function renderContacts() {
        const list = document.getElementById('waContactsList');
        if (!list) return;
        const contacts = getContacts();

        if (contacts.length === 0) {
            list.innerHTML = `
                <div class="wa-empty-contacts">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                    <p>No contacts saved yet</p>
                </div>`;
            return;
        }

        list.innerHTML = contacts.map(c => {
            const initial = (c.name || '?')[0].toUpperCase();
            return `
                <div class="wa-contact-card" data-id="${c.id}">
                    <div class="wa-contact-avatar">${initial}</div>
                    <div class="wa-contact-info">
                        <div class="wa-contact-name">${escapeHtml(c.name)}</div>
                        <div class="wa-contact-phone-display">${c.code} ${c.phone}</div>
                    </div>
                    <div class="wa-contact-actions">
                        <button class="wa-contact-send-btn" data-send-id="${c.id}" title="Send note">Send</button>
                        <button class="wa-contact-delete-btn" data-delete-id="${c.id}" title="Delete">✕</button>
                    </div>
                </div>`;
        }).join('');

        list.querySelectorAll('.wa-contact-send-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const c = contacts.find(x => x.id === btn.dataset.sendId);
                if (!c) return;
                const msg = document.getElementById('waMessagePreview').value || 'Check out this note!';
                sendToWhatsApp(c.phone, c.code, msg);
                logMessage(`${c.name} (${c.code}${c.phone})`, msg);
                renderMessages();
            });
        });

        list.querySelectorAll('.wa-contact-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                removeContact(btn.dataset.deleteId);
                renderContacts();
            });
        });
    }

    function renderMessages() {
        const list = document.getElementById('waMessagesList');
        if (!list) return;
        const msgs = getMessages();

        if (msgs.length === 0) {
            list.innerHTML = `
                <div class="wa-empty-messages">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    <p>No messages sent yet</p>
                </div>`;
            return;
        }

        list.innerHTML = msgs.map(m => {
            const d = new Date(m.timestamp);
            const time = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="wa-message-card">
                    <div class="wa-message-header">
                        <span class="wa-message-to">To: ${escapeHtml(m.to)}</span>
                        <span class="wa-message-time">${time}</span>
                    </div>
                    <div class="wa-message-text">${escapeHtml(m.text)}</div>
                </div>`;
        }).join('');
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function init() {
        const screen = document.getElementById('whatsappScreen');
        const btnOpen = document.getElementById('btnWhatsAppSection');
        const btnBack = document.getElementById('waBackBtn');
        const btnClose = document.getElementById('waCloseBtn');

        if (btnOpen) {
            btnOpen.addEventListener('click', () => {
                screen.classList.add('active');
                updatePreview();
                renderContacts();
                renderMessages();
            });
        }

        function closeWA() {
            screen.classList.remove('active');
        }

        if (btnBack) btnBack.addEventListener('click', closeWA);
        if (btnClose) btnClose.addEventListener('click', closeWA);

        document.querySelectorAll('.wa-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.wa-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.wa-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const target = tab.dataset.tab;
                const tabId = target === 'send' ? 'waTabSend' : target === 'contacts' ? 'waTabContacts' : 'waTabMessages';
                document.getElementById(tabId).classList.add('active');
            });
        });

        document.getElementById('waAddContactBtn').addEventListener('click', () => {
            const name = document.getElementById('waContactName').value.trim();
            const phone = document.getElementById('waContactPhone').value.trim();
            const code = document.getElementById('waContactCode').value;
            if (!name || !phone) return;
            addContact(name, phone, code);
            document.getElementById('waContactName').value = '';
            document.getElementById('waContactPhone').value = '';
            renderContacts();
        });

        document.getElementById('waSendBtn').addEventListener('click', () => {
            const code = document.getElementById('waCountryCode').value;
            const phone = document.getElementById('waPhoneNumber').value.trim();
            const msg = document.getElementById('waMessagePreview').value;
            if (!phone) return;
            sendToWhatsApp(phone, code, msg);
            logMessage(`${code} ${phone}`, msg);
            renderMessages();
        });

        document.getElementById('waCopyBtn').addEventListener('click', () => {
            const msg = document.getElementById('waMessagePreview').value;
            if (!msg) return;
            copyToClipboard(msg);
            document.getElementById('waCopyBtn').textContent = 'Copied!';
            setTimeout(() => {
                document.getElementById('waCopyBtn').innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy Message`;
            }, 2000);
        });

        document.getElementById('waGroupBtn').addEventListener('click', () => {
            const msg = document.getElementById('waMessagePreview').value;
            if (!msg) return;
            sendToGroup(msg);
            logMessage('WhatsApp Group', msg);
            renderMessages();
        });

        document.getElementById('waClearHistoryBtn').addEventListener('click', () => {
            if (confirm('Clear all message history?')) {
                saveMessages([]);
                renderMessages();
            }
        });
    }

    function updatePreview() {
        const preview = document.getElementById('waMessagePreview');
        if (!preview) return;
        if (typeof Editor !== 'undefined') {
            const content = Editor.getContent();
            const title = document.getElementById('noteTitle')?.value || 'Untitled';
            const plain = (content || '').replace(/<[^>]+>/g, '').substring(0, 1000);
            preview.value = `${title}\n\n${plain}`;
        }
    }

    return { init, renderContacts, renderMessages, updatePreview };
})();

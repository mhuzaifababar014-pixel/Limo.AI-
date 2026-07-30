const App = (() => {
    let currentFolder = 'all';
    let currentNoteId = null;
    let aiPanelOpen = false;

    function init() {
        initTheme();
        showApp();
    }

    function initTheme() {
        const theme = Storage.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
    }

    function toggleTheme() {
        const themes = ['dark', 'light', 'purple'];
        const current = document.documentElement.getAttribute('data-theme');
        const idx = themes.indexOf(current);
        const next = themes[(idx + 1) % themes.length];
        document.documentElement.setAttribute('data-theme', next);
        Storage.saveTheme(next);
    }

    function showApp() {
        document.getElementById('mainApp').style.display = 'flex';
        if (!appInitialized) initApp();
    }

    function updateUserUI(user) {
    }

    /* ========== MAIN APP INIT ========== */
    let appInitialized = false;

    function initApp() {
        if (appInitialized) return;
        appInitialized = true;

        Editor.init();
        Search.init();
        initSidebar();
        initFolders();
        initNotes();
        initEditor();
        initAIChat();
        initSettings();
        initDropdown();
        initFolderModal();
        initKeyboardShortcuts();
        initChatbot();
        WhatsApp.init();
        renderFolders();
        renderNotes();
    }

    function initSidebar() {
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        document.getElementById('btnThemeToggle').addEventListener('click', toggleTheme);

        document.getElementById('btnNewNote').addEventListener('click', () => {
            const folderId = currentFolder === 'all' ? 'default' : currentFolder;
            const note = Storage.createNote(folderId);
            renderNotes();
            selectNote(note.id);
            document.getElementById('noteTitle').focus();
        });

        document.getElementById('btnNewFolder').addEventListener('click', () => {
            openFolderModal();
        });
    }

    function initFolders() {
        document.getElementById('btnSettings').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('active');
        });

        document.getElementById('btnCloseSettings').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.remove('active');
        });

        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.target.classList.remove('active');
            }
        });
    }

    function renderFolders() {
        const folders = Storage.getFolders();
        const list = document.getElementById('folderList');
        const notes = Storage.getNotes();

        let html = `
            <li class="folder-item ${currentFolder === 'all' ? 'active' : ''}" data-folder="all">
                <span class="folder-icon">📚</span>
                <span class="folder-name">All Notes</span>
                <span class="folder-count">${notes.length}</span>
            </li>
        `;

        folders.forEach(folder => {
            const count = notes.filter(n => n.folderId === folder.id).length;
            html += `
                <li class="folder-item ${currentFolder === folder.id ? 'active' : ''}" data-folder="${folder.id}">
                    <span class="folder-color" style="background:${folder.color || '#8b5cf6'}"></span>
                    <span class="folder-name">${escapeHtml(folder.name)}</span>
                    <span class="folder-count">${count}</span>
                    <button class="folder-edit-btn" data-folder-id="${folder.id}" title="Rename">✎</button>
                </li>
            `;
        });

        list.innerHTML = html;

        list.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.folder-edit-btn')) return;
                currentFolder = item.dataset.folder;
                renderFolders();
                renderNotes();
                Editor.clearEditor();
                currentNoteId = null;

                const name = currentFolder === 'all'
                    ? 'All Notes'
                    : Storage.getFolders().find(f => f.id === currentFolder)?.name || 'Notes';
                document.getElementById('currentFolderName').textContent = name;
            });
        });

        list.querySelectorAll('.folder-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openFolderModal(btn.dataset.folderId);
            });
        });

        renderTags();
    }

    function renderTags() {
        const tags = Storage.getAllTags();
        const list = document.getElementById('tagList');
        list.innerHTML = tags.map(t =>
            `<span class="tag-item" data-tag="${escapeHtml(t.tag)}">${escapeHtml(t.tag)} <small>${t.count}</small></span>`
        ).join('');

        list.querySelectorAll('.tag-item').forEach(item => {
            item.addEventListener('click', () => {
                Search.performSearch(item.dataset.tag);
            });
        });
    }

    function initNotes() {
        document.getElementById('sortSelect').addEventListener('change', () => renderNotes());

        document.addEventListener('noteUpdated', () => {
            renderNotes();
            renderFolders();
        });
    }

    function renderNotes(notesList = null) {
        let notes = notesList || (currentFolder === 'all'
            ? Storage.getNotes()
            : Storage.getNotesByFolder(currentFolder));

        const sort = document.getElementById('sortSelect')?.value || 'newest';
        if (sort === 'newest') notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        else if (sort === 'oldest') notes.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
        else if (sort === 'alpha') notes.sort((a, b) => (a.title || 'Untitled').localeCompare(b.title || 'Untitled'));

        const list = document.getElementById('notesList');

        if (notes.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p>No notes yet</p>
                    <button class="btn-new-note-empty" onclick="document.getElementById('btnNewNote').click()">Create your first note</button>
                </div>
            `;
            return;
        }

        list.innerHTML = notes.map(note => {
            const plain = (note.content || '').replace(/<[^>]+>/g, '').substring(0, 120);
            const isActive = note.id === currentNoteId;
            const tags = (note.tags || []).map(t => `<span class="note-tag">${escapeHtml(t)}</span>`).join('');
            return `
                <div class="note-card ${isActive ? 'active' : ''}" data-note-id="${note.id}">
                    <h4 class="note-card-title">${escapeHtml(note.title || 'Untitled')}</h4>
                    <p class="note-card-preview">${escapeHtml(plain) || 'Empty note...'}</p>
                    <div class="note-card-meta">
                        <span class="note-card-date">${formatDate(note.updatedAt)}</span>
                        <div class="note-card-tags">${tags}</div>
                    </div>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.note-card').forEach(card => {
            card.addEventListener('click', () => {
                selectNote(card.dataset.noteId);
            });
        });
    }

    function selectNote(noteId) {
        currentNoteId = noteId;
        Editor.setNote(noteId);
        renderNotes();
    }

    function refreshCurrentView() {
        renderNotes();
    }

    function initEditor() {
        document.getElementById('noteTitle').addEventListener('input', () => {
            clearTimeout(Editor._saveTimeout);
            Editor._saveTimeout = setTimeout(() => Editor.saveNote(), 800);
        });

        document.getElementById('noteTitle').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('quillEditor').focus();
            }
        });
    }

    function initAIChat() {
        const panel = document.getElementById('aiPanel');
        const messages = document.getElementById('aiMessages');
        const input = document.getElementById('aiInput');

        document.getElementById('btnAIToggle').addEventListener('click', () => {
            aiPanelOpen = !aiPanelOpen;
            panel.classList.toggle('active', aiPanelOpen);
            document.getElementById('btnAIToggle').classList.toggle('active', aiPanelOpen);
        });

        document.getElementById('btnAIClose').addEventListener('click', () => {
            aiPanelOpen = false;
            panel.classList.remove('active');
            document.getElementById('btnAIToggle').classList.remove('active');
        });

        function addMessage(role, content) {
            const div = document.createElement('div');
            div.className = `ai-message ${role}`;
            div.innerHTML = `<div class="ai-message-content">${formatAIMessage(content)}</div>`;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
            return div;
        }

        async function sendMessage() {
            const text = input.value.trim();
            if (!text) return;

            input.value = '';
            input.style.height = 'auto';
            addMessage('user', text);

            const loading = addMessage('assistant', '<span class="ai-typing"><span></span><span></span><span></span></span>');

            try {
                const noteContent = Editor.getContent();
                let response = '';

                const result = await AI.chat(text, noteContent);
                response = result;
                loading.querySelector('.ai-message-content').innerHTML = formatAIMessage(response);
            } catch (err) {
                loading.querySelector('.ai-message-content').innerHTML = `<span class="ai-error">${escapeHtml(err.message)}</span>`;
            }
        }

        document.getElementById('btnAISend').addEventListener('click', sendMessage);
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

    function formatAIMessage(text) {
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

    function initSettings() {
        const settings = Storage.getSettings();
        const user = Auth.getUser();

        document.getElementById('usernameInput').value = user?.name || '';
        document.getElementById('apiKeyInput').value = settings.apiKey || '';
        document.getElementById('modelSelect').value = settings.model || 'gpt-4o';
        document.getElementById('systemPromptInput').value = settings.systemPrompt || '';

        initThemePicker();

        document.getElementById('btnSaveSettings').addEventListener('click', () => {
            const newName = document.getElementById('usernameInput').value.trim();
            if (newName && user) {
                const users = JSON.parse(localStorage.getItem('limo_users') || '[]');
                const idx = users.findIndex(u => u.id === user.id);
                if (idx >= 0) {
                    users[idx].name = newName;
                    localStorage.setItem('limo_users', JSON.stringify(users));
                    localStorage.setItem('limo_session', JSON.stringify({ ...user, name: newName }));
                    updateUserUI({ ...user, name: newName });
                }
            }

            Storage.saveSettings({
                apiKey: document.getElementById('apiKeyInput').value.trim(),
                model: document.getElementById('modelSelect').value,
                apiEndpoint: 'https://api.openai.com/v1',
                systemPrompt: document.getElementById('systemPromptInput').value.trim()
            });
            document.getElementById('settingsModal').classList.remove('active');
            showToast('Settings saved!', 'success');
        });
    }

    function initThemePicker() {
        const currentTheme = Storage.getTheme();
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === currentTheme);
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                document.documentElement.setAttribute('data-theme', theme);
                Storage.saveTheme(theme);
                document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    function initDropdown() {
        const dropdown = document.getElementById('dropdownMenu');
        const btn = document.getElementById('btnMore');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            dropdown.classList.remove('active');
        });

        document.getElementById('btnExportMD').addEventListener('click', () => {
            if (!currentNoteId) return;
            const note = Storage.getNote(currentNoteId);
            Export.exportMarkdown(note.title || 'Untitled', note.content || '');
        });

        document.getElementById('btnExportTXT').addEventListener('click', () => {
            if (!currentNoteId) return;
            const note = Storage.getNote(currentNoteId);
            Export.exportText(note.title || 'Untitled', note.content || '');
        });

        document.getElementById('btnExportPDF').addEventListener('click', () => {
            if (!currentNoteId) return;
            const note = Storage.getNote(currentNoteId);
            Export.exportPDF(note.title || 'Untitled', note.content || '');
        });

        document.getElementById('btnDuplicate').addEventListener('click', () => {
            if (!currentNoteId) return;
            const dupe = Storage.duplicateNote(currentNoteId);
            if (dupe) {
                renderNotes();
                selectNote(dupe.id);
                showToast('Note duplicated!', 'success');
            }
        });

        document.getElementById('btnDelete').addEventListener('click', () => {
            if (!currentNoteId) return;
            if (confirm('Delete this note?')) {
                Storage.deleteNote(currentNoteId);
                Editor.clearEditor();
                currentNoteId = null;
                renderNotes();
                renderFolders();
                showToast('Note deleted', 'info');
            }
        });

        document.getElementById('btnWhatsApp').addEventListener('click', () => {
            document.getElementById('dropdownMenu').classList.remove('active');
            document.getElementById('whatsappScreen').classList.add('active');
            WhatsApp.updatePreview();
            WhatsApp.renderContacts();
            WhatsApp.renderMessages();
        });

        document.getElementById('btnAddVideo').addEventListener('click', () => {
            if (!currentNoteId) return;
            const url = prompt('Enter video URL (YouTube, Vimeo, or direct video link):');
            if (url) {
                const quill = Editor.getQuill();
                const range = quill.getSelection(true);
                let videoHtml = '';
                if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    const vid = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1];
                    videoHtml = `<div class="video-embed"><iframe width="100%" height="315" src="https://www.youtube.com/embed/${vid}" frameborder="0" allowfullscreen></iframe></div>`;
                } else if (url.includes('vimeo.com')) {
                    const vid = url.match(/vimeo\.com\/(\d+)/)?.[1];
                    videoHtml = `<div class="video-embed"><iframe width="100%" height="315" src="https://player.vimeo.com/video/${vid}" frameborder="0" allowfullscreen></iframe></div>`;
                } else {
                    videoHtml = `<div class="video-embed"><video controls src="${url}"></video></div>`;
                }
                quill.clipboard.dangerouslyPasteHTML(range.index, videoHtml);
                document.getElementById('dropdownMenu').classList.remove('active');
            }
        });

        document.getElementById('btnAddImage').addEventListener('click', () => {
            if (!currentNoteId) return;
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    const quill = Editor.getQuill();
                    const range = quill.getSelection(true);
                    quill.clipboard.dangerouslyPasteHTML(range.index, `<div class="image-embed"><img src="${reader.result}" alt="Note image"></div>`);
                };
                reader.readAsDataURL(file);
            };
            input.click();
            document.getElementById('dropdownMenu').classList.remove('active');
        });
    }

    function initFolderModal() {
        let editingFolderId = null;

        function openModal(folderId = null) {
            editingFolderId = folderId;
            const modal = document.getElementById('folderModal');
            const title = document.getElementById('folderModalTitle');
            const input = document.getElementById('folderNameInput');
            const saveBtn = document.getElementById('btnSaveFolder');

            if (folderId) {
                const folder = Storage.getFolders().find(f => f.id === folderId);
                title.textContent = 'Rename Notebook';
                input.value = folder ? folder.name : '';
                saveBtn.textContent = 'Rename';
            } else {
                title.textContent = 'New Notebook';
                input.value = '';
                saveBtn.textContent = 'Create';
            }

            modal.classList.add('active');
            setTimeout(() => input.focus(), 100);
        }

        function openFolderModal(folderId) {
            openModal(folderId);
        }

        window.openFolderModal = openFolderModal;

        document.getElementById('btnCloseFolderModal').addEventListener('click', () => {
            document.getElementById('folderModal').classList.remove('active');
        });

        document.getElementById('btnCancelFolder').addEventListener('click', () => {
            document.getElementById('folderModal').classList.remove('active');
        });

        document.getElementById('folderModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) e.target.classList.remove('active');
        });

        document.getElementById('btnSaveFolder').addEventListener('click', () => {
            const name = document.getElementById('folderNameInput').value.trim();
            if (!name) return;

            if (editingFolderId) {
                Storage.updateFolder(editingFolderId, { name });
                showToast('Notebook renamed!', 'success');
            } else {
                Storage.createFolder(name);
                showToast('Notebook created!', 'success');
            }

            document.getElementById('folderModal').classList.remove('active');
            renderFolders();
        });

        document.getElementById('folderNameInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('btnSaveFolder').click();
        });
    }

    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                document.getElementById('btnNewNote').click();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                document.getElementById('btnAIToggle').click();
            }
        });
    }

    function initChatbot() {
        Chatbot.init();

        const chatbotBtn = document.getElementById('btnChatbot');
        if (chatbotBtn) {
            chatbotBtn.addEventListener('click', () => {
                Chatbot.open();
            });
        }

        initVoiceRecorder();
    }

    function initVoiceRecorder() {
        const voiceBtn = document.getElementById('btnVoiceRecorder');
        if (!voiceBtn) return;

        let recognition = null;
        let isRecording = false;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            voiceBtn.title = 'Voice recording not supported in this browser';
            voiceBtn.style.opacity = '0.5';
            return;
        }

        voiceBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
                return;
            }

            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            const overlay = document.createElement('div');
            overlay.className = 'recording-overlay';
            overlay.innerHTML = `
                <div class="recording-indicator">
                    <div class="recording-dot"></div>
                    <div class="recording-text">Listening... Speak now</div>
                    <div class="recording-transcript" id="recordingTranscript"></div>
                    <button class="recording-stop-btn" id="recordingStopBtn">Stop Recording</button>
                </div>
            `;
            document.body.appendChild(overlay);

            document.getElementById('recordingStopBtn').addEventListener('click', () => {
                recognition.stop();
            });

            let finalTranscript = '';

            recognition.onresult = (event) => {
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }
                const el = document.getElementById('recordingTranscript');
                if (el) el.textContent = finalTranscript + interim;
            };

            recognition.onend = () => {
                isRecording = false;
                voiceBtn.classList.remove('recording');
                overlay.remove();

                if (finalTranscript.trim() && currentNoteId) {
                    const quill = Editor.getQuill();
                    if (quill) {
                        const range = quill.getSelection(true);
                        const text = finalTranscript.trim();
                        quill.insertText(range.index, text + '\n', { source: 'user' });
                        quill.setSelection(range.index + text.length + 1, 0);
                        Editor.saveNote();
                        showToast('Voice text added!', 'success');
                    }
                }
            };

            recognition.onerror = (event) => {
                isRecording = false;
                voiceBtn.classList.remove('recording');
                overlay.remove();
                if (event.error !== 'no-speech') {
                    showToast('Voice error: ' + event.error, 'error');
                }
            };

            isRecording = true;
            voiceBtn.classList.add('recording');
            recognition.start();
        });
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 10);
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatDate(iso) {
        const d = new Date(iso);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
        return d.toLocaleDateString();
    }

    return {
        init, renderNotes, renderFolders, refreshCurrentView,
        selectNote, showToast, escapeHtml, toggleTheme
    };
})();

document.addEventListener('DOMContentLoaded', () => App.init());

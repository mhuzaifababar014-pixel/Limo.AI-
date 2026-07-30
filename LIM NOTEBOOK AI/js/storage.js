const Storage = (() => {
    const NOTES_KEY = 'limo_notes';
    const FOLDERS_KEY = 'limo_folders';
    const SETTINGS_KEY = 'limo_settings';
    const THEME_KEY = 'limo_theme';
    const USER_KEY = 'limo_user';

    function getNotes() {
        try {
            return JSON.parse(localStorage.getItem(NOTES_KEY)) || [];
        } catch { return []; }
    }

    function saveNotes(notes) {
        localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    }

    function getFolders() {
        try {
            const folders = JSON.parse(localStorage.getItem(FOLDERS_KEY));
            if (folders && folders.length > 0) return folders;
            return [{ id: 'default', name: 'General', color: '#8b5cf6' }];
        } catch {
            return [{ id: 'default', name: 'General', color: '#8b5cf6' }];
        }
    }

    function saveFolders(folders) {
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    }

    function getSettings() {
        try {
            return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
                apiKey: '',
                model: 'gpt-4o',
                apiEndpoint: 'https://api.openai.com/v1',
                systemPrompt: 'You are a helpful AI writing assistant inside a notebook app called Limo.ai. Be concise, helpful, and creative.'
            };
        } catch {
            return {
                apiKey: '',
                model: 'gpt-4o',
                apiEndpoint: 'https://api.openai.com/v1',
                systemPrompt: 'You are a helpful AI writing assistant inside a notebook app called Limo.ai. Be concise, helpful, and creative.'
            };
        }
    }

    function saveSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    function getTheme() {
        return localStorage.getItem(THEME_KEY) || 'dark';
    }

    function saveTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    function createNote(folderId = 'default') {
        const note = {
            id: generateId(),
            title: '',
            content: '',
            folderId: folderId,
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const notes = getNotes();
        notes.unshift(note);
        saveNotes(notes);
        return note;
    }

    function updateNote(id, updates) {
        const notes = getNotes();
        const idx = notes.findIndex(n => n.id === id);
        if (idx !== -1) {
            notes[idx] = { ...notes[idx], ...updates, updatedAt: new Date().toISOString() };
            saveNotes(notes);
            return notes[idx];
        }
        return null;
    }

    function deleteNote(id) {
        const notes = getNotes().filter(n => n.id !== id);
        saveNotes(notes);
    }

    function duplicateNote(id) {
        const notes = getNotes();
        const original = notes.find(n => n.id === id);
        if (!original) return null;
        const dupe = {
            ...original,
            id: generateId(),
            title: original.title + ' (Copy)',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        notes.unshift(dupe);
        saveNotes(notes);
        return dupe;
    }

    function getNote(id) {
        return getNotes().find(n => n.id === id) || null;
    }

    function getNotesByFolder(folderId) {
        if (folderId === 'all') return getNotes();
        return getNotes().filter(n => n.folderId === folderId);
    }

    function createFolder(name) {
        const folder = {
            id: generateId(),
            name: name,
            color: '#8b5cf6'
        };
        const folders = getFolders();
        folders.push(folder);
        saveFolders(folders);
        return folder;
    }

    function updateFolder(id, updates) {
        const folders = getFolders();
        const idx = folders.findIndex(f => f.id === id);
        if (idx !== -1) {
            folders[idx] = { ...folders[idx], ...updates };
            saveFolders(folders);
            return folders[idx];
        }
        return null;
    }

    function deleteFolder(id) {
        const folders = getFolders().filter(f => f.id !== id);
        saveFolders(folders);
        const notes = getNotes().map(n => {
            if (n.folderId === id) n.folderId = 'default';
            return n;
        });
        saveNotes(notes);
    }

    function getAllTags() {
        const notes = getNotes();
        const tagMap = {};
        notes.forEach(n => {
            (n.tags || []).forEach(tag => {
                tagMap[tag] = (tagMap[tag] || 0) + 1;
            });
        });
        return Object.entries(tagMap).map(([tag, count]) => ({ tag, count }));
    }

    function searchNotes(query) {
        if (!query.trim()) return getNotes();
        const q = query.toLowerCase();
        return getNotes().filter(n =>
            (n.title || '').toLowerCase().includes(q) ||
            (n.content || '').toLowerCase().includes(q) ||
            (n.tags || []).some(t => t.toLowerCase().includes(q))
        );
    }

    return {
        getNotes, saveNotes, getFolders, saveFolders,
        getSettings, saveSettings, getTheme, saveTheme,
        generateId, createNote, updateNote, deleteNote,
        duplicateNote, getNote, getNotesByFolder,
        createFolder, updateFolder, deleteFolder,
        getAllTags, searchNotes
    };
})();

const Search = (() => {
    let searchTimeout = null;

    function init() {
        const input = document.getElementById('searchInput');
        input.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 200);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                input.value = '';
                performSearch('');
                input.blur();
            }
        });
    }

    function performSearch(query) {
        const notes = Storage.searchNotes(query);
        App.renderNotesList(notes);

        if (query.trim()) {
            document.getElementById('currentFolderName').textContent = `Search: "${query}"`;
        } else {
            App.refreshCurrentView();
        }
    }

    function clear() {
        document.getElementById('searchInput').value = '';
        performSearch('');
    }

    return { init, performSearch, clear };
})();

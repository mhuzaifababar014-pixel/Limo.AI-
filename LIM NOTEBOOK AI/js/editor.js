const Editor = (() => {
    let quill = null;
    let currentNoteId = null;
    let saveTimeout = null;

    const EMOJIS = {
        'smileys': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐'],
        'gestures': ['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏'],
        'people': ['👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵️','💂','🥷','👷','🫅','🤴','👸','👳','👲','🧕','🤵','👰','🤰','🫃','🤱','👼','🎅','🤶'],
        'nature': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧'],
        'food': ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','🫖','☕','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾'],
        'objects': ['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','🪙','💰','💳','🪪','💎','⚖️','🪜','🧰','🪛','🔧','🔩','⚙️','🗜️','⛏️','🛠️','⚒️','🔨','🪚','🔗','⛓️','🪝','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','🪬','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡️','🧹','🪠','🧺','🧻','🚰','🚿','🛁','🛀','🧼','🫧','🪥','🪒','🧽','🪣','🧴'],
        'symbols': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️','⏪','⏩','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','🟰','♾️','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','💬','💭','🗯️','♠️','♣️','♥️','♦️','🃏','🎴','🀄','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛'],
        'flags': ['🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇮🇹','🇪🇸','🇯🇵','🇰🇷','🇨🇳','🇮🇳','🇧🇷','🇷🇺','🇨🇦','🇦🇺','🇲🇽','🇦🇷','🇹🇷','🇸🇦','🇦🇪','🇿🇦','🇳🇬','🇪🇬','🇰🇪','🇹🇭','🇻🇳','🇮🇩','🇲🇾','🇵🇭','🇸🇬','🇳🇿','🇨🇭','🇸🇪','🇳🇴','🇩🇰','🇫🇮','🇮🇪','🇵🇹','🇬🇷','🇵🇱','🇺🇦','🇨🇿','🇷🇴','🇭🇺'],
        'objects2': ['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯️']
    };

    function init() {
        quill = new Quill('#quillEditor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'align': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['blockquote', 'code-block'],
                    ['link', 'image'],
                    ['clean']
                ]
            },
            placeholder: 'Start writing or paste your notes here...'
        });

        quill.on('text-change', () => {
            if (!currentNoteId) return;
            updateWordCount();
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => saveNote(), 1000);
        });

        initEmojiPicker();
        initAIActions();
    }

    function setNote(noteId) {
        currentNoteId = noteId;
        const note = Storage.getNote(noteId);
        if (!note) return;

        document.getElementById('noteTitle').value = note.title || '';

        if (note.content) {
            quill.root.innerHTML = note.content;
        } else {
            quill.setText('');
        }

        updateWordCount();
        updateTagInput(note.tags || []);
        document.getElementById('editorPanel').classList.add('active');
        document.getElementById('lastSaved').textContent = 'Last saved: ' + new Date(note.updatedAt).toLocaleString();
    }

    function saveNote() {
        if (!currentNoteId) return;
        const title = document.getElementById('noteTitle').value;
        const content = quill.root.innerHTML;
        const tags = getTagsFromInput();

        Storage.updateNote(currentNoteId, { title, content, tags });
        document.getElementById('lastSaved').textContent = 'Last saved: ' + new Date().toLocaleString();
        document.dispatchEvent(new CustomEvent('noteUpdated', { detail: { id: currentNoteId } }));
    }

    function clearEditor() {
        currentNoteId = null;
        quill.setText('');
        document.getElementById('noteTitle').value = '';
        document.getElementById('tagInput').value = '';
        document.getElementById('wordCount').textContent = '0 words';
        document.getElementById('charCount').textContent = '0 characters';
        document.getElementById('lastSaved').textContent = '';
        document.getElementById('editorPanel').classList.remove('active');
    }

    function getContent() {
        return quill ? quill.getText().trim() : '';
    }

    function getHtmlContent() {
        return quill ? quill.root.innerHTML : '';
    }

    function setContent(html) {
        if (quill) quill.root.innerHTML = html;
    }

    function replaceContent(html) {
        if (quill) {
            quill.root.innerHTML = html;
            saveNote();
        }
    }

    function updateWordCount() {
        const text = quill.getText().trim();
        const words = text ? text.split(/\s+/).length : 0;
        const chars = text.length;
        document.getElementById('wordCount').textContent = words + ' word' + (words !== 1 ? 's' : '');
        document.getElementById('charCount').textContent = chars + ' character' + (chars !== 1 ? 's' : '');
    }

    function updateTagInput(tags) {
        document.getElementById('tagInput').value = tags.join(', ');
    }

    function getTagsFromInput() {
        const val = document.getElementById('tagInput').value;
        return val.split(',').map(t => t.trim()).filter(Boolean);
    }

    function initEmojiPicker() {
        const grid = document.getElementById('emojiGrid');
        const search = document.getElementById('emojiSearch');
        const picker = document.getElementById('emojiPicker');

        function renderEmojis(filter = '') {
            grid.innerHTML = '';
            const filterLower = filter.toLowerCase();
            for (const [category, emojis] of Object.entries(EMOJIS)) {
                const filtered = filter
                    ? emojis.filter(() => category.toLowerCase().includes(filterLower) || filterLower.length <= 1)
                    : emojis;
                if (filtered.length === 0) continue;

                const catHeader = document.createElement('div');
                catHeader.className = 'emoji-category-header';
                catHeader.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                grid.appendChild(catHeader);

                filtered.forEach(emoji => {
                    const btn = document.createElement('button');
                    btn.className = 'emoji-btn';
                    btn.textContent = emoji;
                    btn.addEventListener('click', () => {
                        const range = quill.getSelection(true);
                        quill.insertText(range.index, emoji, Quill.sources.USER);
                        quill.setSelection(range.index + emoji.length, Quill.sources.SILENT);
                        picker.classList.remove('active');
                    });
                    grid.appendChild(btn);
                });
            }
        }

        renderEmojis();

        search.addEventListener('input', (e) => {
            renderEmojis(e.target.value);
        });

        document.addEventListener('click', (e) => {
            if (!picker.contains(e.target) && !e.target.closest('.emoji-trigger')) {
                picker.classList.remove('active');
            }
        });
    }

    function initAIActions() {
        document.querySelectorAll('.ai-action-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.dataset.action;
                const content = getContent();
                if (!content) {
                    App.showToast('Write something first!', 'warning');
                    return;
                }

                btn.classList.add('loading');
                btn.disabled = true;

                try {
                    const result = await AI.aiAction(action, content, (partial) => {
                        quill.root.innerHTML = markedToHtml(partial);
                    });
                    quill.root.innerHTML = markedToHtml(result);
                    saveNote();
                    App.showToast(action.charAt(0).toUpperCase() + action.slice(1) + ' complete!', 'success');
                } catch (err) {
                    App.showToast(err.message, 'error');
                } finally {
                    btn.classList.remove('loading');
                    btn.disabled = false;
                }
            });
        });
    }

    function markedToHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    return {
        init, setNote, saveNote, clearEditor,
        getContent, getHtmlContent, setContent, replaceContent,
        getTagsFromInput, getQuill: () => quill, EMOJIS
    };
})();

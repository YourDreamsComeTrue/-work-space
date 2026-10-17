let db;
let notes = [];
let currentNoteIndex = null;
let pendingAction = null;

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// تهيئة قاعدة البيانات IndexedDB لحفظ الملفات والفيديوهات بذاكرة ضخمة
const dbRequest = indexedDB.open("NotesAppLargeStorageDB", 1);

dbRequest.onupgradeneeded = function(e) {
    db = e.target.result;
    if (!db.objectStoreNames.contains("notesStore")) {
        db.createObjectStore("notesStore", { keyPath: "id" });
    }
};

dbRequest.onsuccess = function(e) {
    db = e.target.result;
    loadDataFromDB();
};

dbRequest.onerror = function() {
    console.error("خطأ في فتح قاعدة البيانات");
};

function loadDataFromDB() {
    if (!db) return;
    const tx = db.transaction("notesStore", "readonly");
    const store = tx.objectStore("notesStore");
    const req = store.get(1);

    req.onsuccess = function() {
        if (req.result && req.result.notes) {
            notes = req.result.notes;
        }
        renderTitles();
    };
}

function saveData() {
    if (!db) return;
    const tx = db.transaction("notesStore", "readwrite");
    const store = tx.objectStore("notesStore");
    store.put({ id: 1, notes: notes });
}

function renderTitles() {
    const list = document.getElementById('titlesList');
    list.innerHTML = '';

    notes.forEach((note, index) => {
        const li = document.createElement('li');
        li.className = 'title-item';
        li.style.borderRightColor = note.color || '#3498db';

        li.innerHTML = `
            <span class="title-text" style="color: ${note.color || '#333'}" onclick="openEditor(${index})">${escapeHtml(note.title)}</span>
            <div class="actions">
                <div class="color-picker-wrapper" title="تغيير اللون">
                    <input type="color" value="${note.color || '#3498db'}" onchange="changeColor(${index}, this.value)">
                </div>
                <button type="button" class="delete-btn-red" onclick="askDeleteNote(${index})" title="حذف">✕</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function addTitle(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('newTitleInput');
    const title = input.value.trim();

    if (!title) return;

    notes.push({ title: title, color: '#3498db', content: '' });
    input.value = '';
    saveData();
    renderTitles();
}

function changeColor(index, color) {
    notes[index].color = color;
    saveData();
    renderTitles();
}

function askDeleteNote(index) {
    document.getElementById('confirmText').innerText = "هل ترغب حقاً في حذف هذا العنوان بمحتوياته؟";
    pendingAction = () => {
        notes.splice(index, 1);
        saveData();
        renderTitles();
    };
    document.getElementById('confirmModal').style.display = 'flex';
}

function askDeleteMedia(btn) {
    document.getElementById('confirmText').innerText = "هل ترغب في حذف هذا العنصر؟";
    pendingAction = () => {
        const box = btn.closest('.media-box');
        if (box) {
            box.remove();
            autoSaveContent();
        }
    };
    document.getElementById('confirmModal').style.display = 'flex';
}

function confirmAction(isYes) {
    if (isYes && pendingAction) pendingAction();
    document.getElementById('confirmModal').style.display = 'none';
    pendingAction = null;
}

function openEditor(index) {
    currentNoteIndex = index;
    document.getElementById('modalTitle').innerText = notes[index].title;
    document.getElementById('editorContent').innerHTML = notes[index].content || '';
    document.getElementById('editorModal').style.display = 'flex';
}

function closeEditor() {
    autoSaveContent();
    if (isRecording) stopRecording();
    document.getElementById('editorModal').style.display = 'none';
    currentNoteIndex = null;
}

function autoSaveContent() {
    if (currentNoteIndex !== null) {
        notes[currentNoteIndex].content = document.getElementById('editorContent').innerHTML;
        saveData();
    }
}

function execCmd(command) {
    document.execCommand(command, false, null);
    autoSaveContent();
}

function triggerFileInput(type) {
    const fileInput = document.getElementById('fileInput');
    fileInput.accept = type;
    fileInput.click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        let html = '';
        if (file.type.startsWith('image/')) {
            html = createMediaBox(`<img src="${e.target.result}">`);
        } else if (file.type.startsWith('video/')) {
            html = createMediaBox(`<video controls src="${e.target.result}"></video>`);
        } else if (file.type.startsWith('audio/')) {
            html = createMediaBox(`<audio controls src="${e.target.result}"></audio>`);
        }
        insertHTML(html);
        autoSaveContent();
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

/* التسجيل الصوتي المباشر */
async function toggleAudioRecording() {
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                const reader = new FileReader();
                reader.onload = function(e) {
                    const html = createMediaBox(`<audio controls src="${e.target.result}"></audio>`);
                    insertHTML(html);
                    autoSaveContent();
                };
                reader.readAsDataURL(audioBlob);
            };

            mediaRecorder.start();
            isRecording = true;
            document.getElementById('micBtn').classList.add('recording');
        } catch (err) {
            alert('يرجى السماح بصلاحية الميكروفون لاستخدام التسجيل');
        }
    } else {
        stopRecording();
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('micBtn').classList.remove('recording');
    }
}

function createMediaBox(elementHtml) {
    return `
        <div class="media-box" contenteditable="false">
            <div class="media-controls">
                <button type="button" class="mini-btn" onclick="resizeMedia(this, 1.2)">+</button>
                <button type="button" class="mini-btn" onclick="resizeMedia(this, 0.8)">-</button>
                <button type="button" class="mini-btn del" onclick="askDeleteMedia(this)">✕</button>
            </div>
            ${elementHtml}
        </div><p><br></p>`;
}

function resizeMedia(btn, factor) {
    const box = btn.closest('.media-box');
    const media = box.querySelector('img, video, iframe, audio');
    if (media) {
        let currentWidth = media.clientWidth || 280;
        media.style.width = (currentWidth * factor) + 'px';
        media.style.maxWidth = 'none';
        autoSaveContent();
    }
}

function addYoutubeVideo() {
    const url = prompt('أدخل رابط فيديو YouTube:');
    if (url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            const embedUrl = `https://www.youtube.com/embed/${match[2]}`;
            const html = createMediaBox(`<iframe width="320" height="200" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`);
            insertHTML(html);
            autoSaveContent();
        }
    }
}

function insertHTML(html) {
    document.getElementById('editorContent').focus();
    document.execCommand('insertHTML', false, html);
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
              }


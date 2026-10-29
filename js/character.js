// --- CHARACTER BIO, AVATAR, JOURNAL & STAT BLOCK IMAGES ---

function loadAvatar(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('avatarImg').src = e.target.result;
            saveData();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// --- JOURNAL ---
function addJournalEntry() {
    const nextSessionNum = journal.length + 1;
    journal.push({ title: `Session ${nextSessionNum}`, content: "" });
    renderJournal();
    saveData();
}

function renderJournal() {
    const container = document.getElementById('journalContainer');
    container.innerHTML = '';

    journal.forEach((entry, idx) => {
        const div = document.createElement('div');
        div.className = 'journal-entry';
        div.innerHTML = `
            <div class="journal-header">
                <div style="flex:1">
                    <input type="text" class="journal-title-input" value="${entry.title}" 
                        oninput="updateJournal(${idx}, 'title', this.value)">
                </div>
                <i class="ph ph-trash btn-del" style="margin-left:10px;" onclick="deleteJournal(${idx})"></i>
            </div>
            <textarea class="journal-body" placeholder="Write your notes here..." 
                    oninput="updateJournal(${idx}, 'content', this.value)">${entry.content}</textarea>
        `;
        container.appendChild(div);
    });
}

function updateJournal(idx, field, val) {
    journal[idx][field] = val;
    saveData();
}

function deleteJournal(idx) {
    showConfirm("Delete this journal entry?", () => {
        journal.splice(idx, 1);
        renderJournal();
        saveData();
    });
}

// --- STAT BLOCKS & IMAGES ---
function addStatBlock(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            statImages.push({
                src: e.target.result,
                w: '300px',
                h: 'auto'
            });
            renderStatImages();
            saveData();
            input.value = '';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function renderStatImages() {
    const container = document.getElementById('statBlocksContainer');
    container.innerHTML = '';

    statImages.forEach((imgData, idx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'stat-block-wrapper';
        wrapper.style.width = imgData.w;
        wrapper.style.height = imgData.h;

        wrapper.innerHTML = `
            <div class="stat-block-del" onclick="deleteStatImage(${idx})"><i class="ph ph-x"></i></div>
            <img src="${imgData.src}" class="stat-block-img">
        `;

        container.appendChild(wrapper);

        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                statImages[idx].w = entry.target.style.width;
                statImages[idx].h = entry.target.style.height;
            }
        });
        observer.observe(wrapper);

        wrapper.addEventListener('mouseup', saveData);
    });
}

function deleteStatImage(idx) {
    showConfirm("Delete this image?", () => {
        statImages.splice(idx, 1);
        renderStatImages();
        saveData();
    });
}

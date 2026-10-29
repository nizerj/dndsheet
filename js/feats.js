// --- FEATS & TRAITS ---

function openFeatModal() {
    editingFeatIndex = null;
    document.getElementById('featModal').classList.add('active');
    document.getElementById('nfName').value = '';
    document.getElementById('nfType').value = 'Class Feat';
    document.getElementById('nfDesc').value = '';
}

function editFeat(index) {
    editingFeatIndex = index;
    const f = feats[index];
    document.getElementById('featModal').classList.add('active');
    document.getElementById('nfName').value = f.t;
    document.getElementById('nfType').value = f.type;
    document.getElementById('nfDesc').value = f.d;
}

function addFeatFromModal() {
    const title = document.getElementById('nfName').value;
    if (!title) return;

    const newFeat = {
        t: title,
        d: document.getElementById('nfDesc').value,
        type: document.getElementById('nfType').value
    };

    if (editingFeatIndex !== null) {
        feats[editingFeatIndex] = newFeat;
    } else {
        feats.push(newFeat);
    }
    renderFeats();
    closeModal('featModal');
    saveData();
}

function renderFeats() {
    const container = document.getElementById('classFeatsContainer');
    container.innerHTML = '';
    feats.forEach((f, idx) => {
        const div = document.createElement('div');
        div.className = 'feat-item';
        div.innerHTML = `
            <div class="feat-header">
                <span><span class="feat-tag">${f.type}</span> ${f.t}</span>
                <div style="display:flex; align-items:center;">
                    <i class="ph ph-caret-up btn-edit" style="margin-right:5px; cursor:pointer;" onclick="moveFeat(${idx}, -1)" title="Move Up"></i>
                    <i class="ph ph-caret-down btn-edit" style="margin-right:10px; cursor:pointer;" onclick="moveFeat(${idx}, 1)" title="Move Down"></i>
                    <i class="ph ph-pencil-simple btn-edit" style="margin-right:10px" onclick="editFeat(${idx})"></i>
                    <i class="ph ph-trash btn-del" onclick="feats.splice(${idx},1); renderFeats(); saveData()"></i>
                </div>
            </div>
            <div class="feat-desc">${convertText(f.d)}</div>
        `;
        container.appendChild(div);
    });
}

function moveFeat(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= feats.length) return;

    [feats[index], feats[newIndex]] = [feats[newIndex], feats[index]];

    renderFeats();
    saveData();
}

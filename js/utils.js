// --- UTILITIES, UI HELPERS & EVENT HANDLERS ---

// --- UNIT CONVERSION ---
function toggleUnits() {
    useMetric = document.getElementById('unitToggle').checked;
    document.getElementById('lblWeight').innerText = useMetric ? "Weight (kg)" : "Weight (lb)";
    updateSheet();
    renderInventory();
    renderSpellbook();
}

function toggleModalUnit() {
    const isM = document.getElementById('newItemMetric').checked;
    document.getElementById('lblWeight').innerText = isM ? "Weight (kg)" : "Weight (lb)";
}

function formatDist(val) {
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    if (useMetric) return (num * 0.3).toFixed(1) + " m";
    return num + " ft";
}

function formatWgt(val) {
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    // 1 lb = 0.5 kg
    if (useMetric) return (num * 0.5).toFixed(1) + " kg";
    return num.toFixed(1) + " lb";
}

function formatBonus(val) {
    return val >= 0 ? `+${val}` : val;
}

// --- TEXT FORMATTING ---
function convertText(text) {
    if (!text) return "";

    let clean = String(text)
        // 1. Normalize line breaks first
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")

        // 2. Sanitize weird Word bullets into standard dashes
        .replace(/\uf0b7/g, "\n- ")
        .replace(//g, "- ")
        .replace(/\u2022/g, "\n- ")
        .replace(/\u2023/g, "\n- ")

        // 3. Render Tags (Bold & Red)
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/<r>(.*?)<\/r>/g, '<span style="color: #911111; font-weight:bold;">$1</span>');

    // 4. "SMART WRAP" LOGIC
    // Step A: Protect real paragraphs (Double Enters) by renaming them temporarily
    clean = clean.replace(/\n\s*\n/g, "{{PARAGRAPH}}");

    // Step B: If a Newline is NOT followed by a Dash (-), turn it into a Space.
    clean = clean.replace(/\n(?!\s*-)/g, " ");

    // Step C: Restore the real paragraphs
    clean = clean.replace(/{{PARAGRAPH}}/g, "\n\n");

    // 5. Final HTML conversion
    return clean.trim().replace(/\n/g, '<br>');
}

// --- CUSTOM POPUPS & MODALS ---
function showPopup(message) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.zIndex = '200';
    overlay.innerHTML = `
        <div class="modal" style="height:auto; min-height:100px; text-align:center;">
            <p style="white-space: pre-line;">${message}</p>
            <button class="btn-add" style="margin-top:10px; width:100px; border:1px solid var(--text-main); color:var(--text-main);" 
                    onclick="this.closest('.modal-overlay').remove()">OK</button>
        </div>`;
    document.body.appendChild(overlay);
}

function showConfirm(message, onYes) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.zIndex = '200';
    overlay.innerHTML = `
        <div class="modal" style="height:auto; min-height:100px; text-align:center;">
            <p>${message}</p>
            <div style="display:flex; gap:10px; justify-content:center; margin-top:10px;">
                <button class="btn-add" style="width:80px; border:1px solid var(--text-main); color:var(--text-main);" 
                        id="confirmYes">Yes</button>
                <button class="btn-add" style="width:80px; border:1px solid var(--accent); color:var(--accent);" 
                        onclick="this.closest('.modal-overlay').remove()">No</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    document.getElementById('confirmYes').onclick = function () {
        overlay.remove();
        onYes();
    };
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// --- NAVIGATION & SIDEBAR ---
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    sb.classList.toggle('collapsed');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    const map = { 'stats': 0, 'combat': 1, 'class': 2, 'spells': 3, 'gear': 4, 'char': 5 };
    const buttons = document.querySelectorAll('.nav-btn');
    if (buttons[map[tabId]]) buttons[map[tabId]].classList.add('active');
}

// --- TEXT INPUT ENHANCEMENTS (Paste Sanitizer & Formatting Shortcuts) ---
function applyTag(el, startTag, endTag) {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;

    const selected = text.substring(start, end);
    const replacement = startTag + selected + endTag;

    el.value = text.substring(0, start) + replacement + text.substring(end);

    const newCursorPos = selected.length > 0 ? start + replacement.length : start + startTag.length;
    el.selectionStart = el.selectionEnd = newCursorPos;

    el.dispatchEvent(new Event('input'));
}

document.addEventListener('paste', function (e) {
    if (e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && e.target.type === 'text')) {
        e.preventDefault();

        let text = (e.clipboardData || window.clipboardData).getData('text');
        if (!text) return;

        // Convert Word/Weird Bullets to New Lines + Dash
        text = text
            .replace(/\uf0b7/g, "\n- ")
            .replace(//g, "\n- ")
            .replace(/\u2022/g, "\n- ")
            .replace(/\u2023/g, "\n- ");

        const el = e.target;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const val = el.value;

        el.value = val.slice(0, start) + text + val.slice(end);
        el.selectionStart = el.selectionEnd = start + text.length;

        el.dispatchEvent(new Event('input'));
    }
});

document.addEventListener('keydown', function (e) {
    if (e.target.tagName !== 'TEXTAREA' && e.target.type !== 'text') return;

    // CTRL + B for Bold (**text**)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        applyTag(e.target, '**', '**');
    }

    // CTRL + ; for Red Color (<r>text</r>)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === ';') {
        e.preventDefault();
        applyTag(e.target, '<r>', '</r>');
    }
});

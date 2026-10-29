// --- SPELLBOOK, SLOTS & SPELLCASTING ---

function renderPips(level) {
    const count = document.getElementById(`slotMax_${level}`).value;
    const container = document.getElementById(`pips_${level}`);
    let usedCount = 0;
    if (container.children.length > 0) {
        usedCount = Array.from(container.children).filter(c => c.classList.contains('used')).length;
    }
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const pip = document.createElement('div');
        pip.className = 'pip';
        if (i < usedCount) pip.classList.add('used');
        pip.onclick = function () {
            this.classList.toggle('used');
            saveData();
        };
        container.appendChild(pip);
    }
    renderSpellbook();
}

function resetSlots() {
    document.querySelectorAll('#slotContainer .pip.used').forEach(p => p.classList.remove('used'));

    const spMax = document.getElementById('specialPointsMax') || document.getElementById('spMax');
    const spCurr = document.getElementById('specialPointsCurr') || document.getElementById('spCurr');
    if (spMax && spCurr) {
        spCurr.value = spMax.value;
    }

    saveData();
}

// --- SPELL MODAL & CRUD ---
function openSpellModal() {
    editingSpellIndex = null;
    document.getElementById('spellModal').classList.add('active');

    document.getElementById('nsName').value = '';
    document.getElementById('nsLevel').value = 0;
    document.getElementById('nsSchool').value = '';
    document.getElementById('nsTime').value = '1 Action';
    document.getElementById('nsRange').value = '60 ft';
    document.getElementById('nsDur').value = 'Instant';
    document.getElementById('nsDmg').value = '';
    document.getElementById('nsDesc').value = '';
    document.getElementById('nsCompsList').innerHTML = '';
    addSpellCompRow();
}

function editSpell(index, e) {
    e.stopPropagation();
    editingSpellIndex = index;
    const s = spells[index];
    document.getElementById('spellModal').classList.add('active');

    document.getElementById('nsName').value = s.n;
    document.getElementById('nsLevel').value = s.lvl;
    document.getElementById('nsSchool').value = s.sch;
    document.getElementById('nsTime').value = s.time;
    document.getElementById('nsRange').value = s.range;
    document.getElementById('nsDur').value = s.dur;
    document.getElementById('nsDmg').value = s.dmg;
    document.getElementById('nsDesc').value = s.desc;

    document.getElementById('nsCompsList').innerHTML = '';
    const compList = s.comps ? s.comps : (s.comp ? [s.comp] : []);
    if (compList.length === 0) {
        addSpellCompRow();
    } else {
        compList.forEach(c => addSpellCompRow(c));
    }
}

function addSpellCompRow(val = '') {
    const div = document.createElement('div');
    div.className = 'comp-row';
    div.style.display = 'flex';
    div.style.gap = '5px';
    div.style.marginTop = '5px';
    div.innerHTML = `
        <input type="text" class="sheet-input comp-input" value="${val}" placeholder="e.g. Diamond (300) OR Orb">
        <i class="ph ph-trash btn-del" style="padding-top:8px;" onclick="this.parentElement.remove()"></i>
    `;
    document.getElementById('nsCompsList').appendChild(div);
}

function addSpellFromModal() {
    const name = document.getElementById('nsName').value;
    if (!name) return;

    const comps = Array.from(document.querySelectorAll('#nsCompsList .comp-input'))
        .map(i => i.value)
        .filter(v => v.trim() !== "");

    const newSpell = {
        n: name,
        lvl: document.getElementById('nsLevel').value,
        sch: document.getElementById('nsSchool').value,
        time: document.getElementById('nsTime').value,
        range: document.getElementById('nsRange').value,
        dur: document.getElementById('nsDur').value,
        dmg: document.getElementById('nsDmg').value,
        comps: comps,
        desc: document.getElementById('nsDesc').value,
        prep: editingSpellIndex !== null ? spells[editingSpellIndex].prep : false
    };

    if (editingSpellIndex !== null) {
        spells[editingSpellIndex] = newSpell;
    } else {
        spells.push(newSpell);
    }

    renderSpellbook();
    closeModal('spellModal');
    saveData();
}

// --- SPELLBOOK RENDERING & CASTING ---
function setSpellFilter(filter) {
    currentSpellFilter = filter;
    renderSpellbook();
}

function generateCastDots(baseLvl, maxSlotLvl, idx) {
    baseLvl = parseInt(baseLvl) || 0;
    if (baseLvl === 0) {
        return `<span style="font-size:0.7rem; color:var(--text-muted); font-weight:bold; padding:0 4px;">Cantrip</span>`;
    }

    let html = '';
    let maxDots = Math.max(baseLvl, maxSlotLvl);
    for (let i = 1; i <= maxDots; i++) {
        let isChecked = i <= baseLvl ? 'used' : '';
        let isLocked = i < baseLvl ? 'locked' : '';
        let clickHandler = i >= baseLvl
            ? `onclick="setCastLevel(${idx}, ${i}, ${baseLvl}, event)"`
            : `onclick="event.stopPropagation()"`;
        html += `<div class="pip ${isChecked} ${isLocked}" ${clickHandler} title="Cast at Level ${i}"></div>`;
    }
    return html;
}

function setCastLevel(idx, selectedLvl, baseLvl, event) {
    event.stopPropagation();
    if (selectedLvl < baseLvl) return;

    const container = document.getElementById(`cast-level-${idx}`);
    container.setAttribute('data-selected', selectedLvl);

    const pips = container.querySelectorAll('.pip');
    pips.forEach((pip, i) => {
        let pipLvl = i + 1;
        if (pipLvl <= selectedLvl) pip.classList.add('used');
        else pip.classList.remove('used');
    });
}

function renderSpellbook() {
    const container = document.getElementById('spellbookContainer');
    if (!container) return;
    container.innerHTML = '';

    // 1. Calculate max spell slot level available
    let maxSlotLevel = 0;
    for (let i = 1; i <= 9; i++) {
        const slotEl = document.getElementById(`slotMax_${i}`);
        let max = slotEl ? (parseInt(slotEl.value) || 0) : 0;
        if (max > 0) maxSlotLevel = i;
    }

    // 2. Identify known spell levels
    let availableLevels = new Set();
    spells.forEach(s => availableLevels.add(s.lvl.toString()));
    let levelsArray = Array.from(availableLevels).sort((a, b) => parseInt(a) - parseInt(b));

    if (currentSpellFilter !== 'Prepared' && !availableLevels.has(currentSpellFilter)) {
        currentSpellFilter = 'Prepared';
    }

    // 3. Build Filter Tabs
    let filterHtml = `<div class="spell-filters">`;
    filterHtml += `<button class="filter-btn ${currentSpellFilter === 'Prepared' ? 'active' : ''}" onclick="setSpellFilter('Prepared')">Prepared</button>`;
    levelsArray.forEach(lvlStr => {
        let lvl = parseInt(lvlStr);
        let label = lvl === 0 ? 'Cantrips' : `Level ${lvl}`;
        filterHtml += `<button class="filter-btn ${currentSpellFilter === lvlStr ? 'active' : ''}" onclick="setSpellFilter('${lvlStr}')">${label}</button>`;
    });
    filterHtml += `</div>`;
    container.innerHTML = filterHtml;

    // 4. Render Spells for Current Filter
    const listContainer = document.createElement('div');

    let spellsWithIdx = spells.map((s, i) => ({ ...s, _origIdx: i }));
    if (currentSpellFilter === 'Prepared') {
        spellsWithIdx = spellsWithIdx.filter(s => s.prep);
    } else {
        spellsWithIdx = spellsWithIdx.filter(s => s.lvl.toString() === currentSpellFilter);
    }

    spellsWithIdx.sort((a, b) => a.lvl - b.lvl);

    spellsWithIdx.forEach((s) => {
        const idx = s._origIdx;
        const div = document.createElement('div');
        div.className = 'spell-card';

        const compList = s.comps ? s.comps : (s.comp ? [s.comp] : []);
        const isPrep = s.prep || false;

        div.innerHTML = `
            <div class="spell-top">
                <strong style="color:var(--accent)">${s.n}</strong>
                <span class="spell-meta">Lvl ${s.lvl} ${s.sch}</span>
            </div>
            <div class="spell-top" style="margin-top:5px; align-items:center;">
                <span class="spell-meta">${convertText(s.time)} | ${convertText(s.range)}</span>
                <div style="display:flex; gap:5px; align-items:center;">
                    <div class="cast-level-selector" id="cast-level-${idx}" data-selected="${s.lvl}">
                        ${generateCastDots(s.lvl, maxSlotLevel, idx)}
                    </div>
                    <button class="cast-btn" ${isPrep || s.lvl == 0 ? '' : 'disabled'} onclick="castSpell(${idx}, event)">Cast</button>
                    <button class="cast-btn prep-btn ${isPrep ? 'active' : ''}" onclick="toggleSpellPrep(${idx}, event)">Prep</button>
                    <div class="btn-edit" onclick="editSpell(${idx}, event)"><i class="ph ph-pencil-simple"></i></div>
                    <i class="ph ph-trash btn-del" onclick="spells.splice(${idx},1); renderSpellbook(); saveData(); event.stopPropagation()"></i>
                </div>
            </div>
            <div class="spell-details">
                <p><strong>Duration:</strong> ${convertText(s.dur)} | <strong>Effect:</strong> ${convertText(s.dmg)}</p>
                <p><strong>Components:</strong> ${compList.join(', ') || 'None'}</p>
                <p>${convertText(s.desc)}</p>
            </div>
        `;

        div.onclick = (e) => {
            if (
                e.target.tagName !== 'BUTTON' &&
                e.target.tagName !== 'I' &&
                !e.target.classList.contains('btn-edit') &&
                !e.target.classList.contains('pip')
            ) {
                div.querySelector('.spell-details').classList.toggle('open');
            }
        };
        listContainer.appendChild(div);
    });

    container.appendChild(listContainer);
}

function toggleSpellPrep(idx, event) {
    event.stopPropagation();
    spells[idx].prep = !spells[idx].prep;
    renderSpellbook();
    saveData();
}

function castSpell(idx, e) {
    e.stopPropagation();
    const spell = spells[idx];
    const rawComps = spell.comps ? spell.comps : (spell.comp ? [spell.comp] : []);

    // 1. Determine Cast Level
    let castLevel = parseInt(spell.lvl);
    const levelContainer = document.getElementById(`cast-level-${idx}`);
    if (levelContainer && levelContainer.getAttribute('data-selected')) {
        castLevel = parseInt(levelContainer.getAttribute('data-selected'));
    }

    // 2. Pre-check for spell slots
    let targetPipContainer = null;
    if (castLevel > 0) {
        targetPipContainer = document.getElementById(`pips_${castLevel}`);
        const maxSlots = parseInt(document.getElementById(`slotMax_${castLevel}`).value) || 0;
        let usedCount = targetPipContainer
            ? Array.from(targetPipContainer.children).filter(c => c.classList.contains('used')).length
            : 0;

        if (usedCount >= maxSlots || maxSlots === 0) {
            showPopup(`No level ${castLevel} spell slots available!`);
            return;
        }
    }

    // 3. Check for Equipped Focus
    let hasFocus = false;
    const armorIdx = document.getElementById('equippedArmor').value;
    if (armorIdx !== "" && inventory[armorIdx] && inventory[armorIdx].isFocus) hasFocus = true;

    if (!hasFocus) {
        document.querySelectorAll('.item-select').forEach(sel => {
            const val = sel.value;
            if (val !== "" && inventory[val] && inventory[val].isFocus) hasFocus = true;
        });
    }

    let missing = [];
    let tempUsed = {};

    const findValidItem = (name, minCost) => {
        const candidates = inventory.map((item, i) => ({ item, i }))
            .filter(x => x.item.n.toLowerCase() === name && (x.item.cost || 0) >= minCost);

        for (const cand of candidates) {
            const alreadyUsed = tempUsed[cand.i] || 0;
            if (cand.item.q - alreadyUsed > 0) return cand.i;
        }
        return -1;
    };

    const regex = /^([^(]+)(?:\s*\((\d+)\))?$/;

    // 4. Parse and Check Components
    for (let rawStr of rawComps) {
        const andParts = rawStr.split(/\s+AND\s+/i);

        for (let requirement of andParts) {
            const options = requirement.split(/\s+OR\s+/i);
            let requirementMet = false;

            for (let opt of options) {
                const match = opt.trim().match(regex);
                if (!match) continue;

                const compName = match[1].trim().toLowerCase();
                const minCost = match[2] ? parseInt(match[2]) : 0;

                if (hasFocus && minCost === 0) {
                    requirementMet = true;
                    break;
                }

                const foundIdx = findValidItem(compName, minCost);
                if (foundIdx !== -1) {
                    tempUsed[foundIdx] = (tempUsed[foundIdx] || 0) + 1;
                    requirementMet = true;
                    break;
                }
            }

            if (!requirementMet) missing.push(requirement.trim());
        }
    }

    // 5. Execution (Consume slot & components)
    if (missing.length > 0) {
        let errorMsg = `Cannot cast ${spell.n}. Missing: ${missing.join(', ')}`;
        if (!hasFocus && missing.some(m => !m.match(/\(\d+\)/))) {
            errorMsg += "\n\n(Tip: Equip a Spellcasting Focus to ignore non-cost components)";
        }
        showPopup(errorMsg);
    } else {
        if (targetPipContainer) {
            const unusedPip = Array.from(targetPipContainer.children).find(c => !c.classList.contains('used'));
            if (unusedPip) unusedPip.classList.add('used');
        }

        let msg = `Cast ${spell.n}`;
        if (castLevel > 0 && castLevel != spell.lvl) msg += ` (Upcast at Level ${castLevel})!`;
        else msg += `!`;

        const usedIndices = Object.keys(tempUsed);
        if (usedIndices.length > 0) {
            msg += " Consumed:";
            usedIndices.forEach(idx => {
                const amount = tempUsed[idx];
                inventory[idx].q -= amount;
                msg += `\n- ${amount} ${inventory[idx].n} (Remaining: ${inventory[idx].q})`;
            });
        } else if (hasFocus && rawComps.length > 0) {
            msg += "\n(Components provided by Spellcasting Focus)";
        }

        showPopup(msg);
        renderInventory();
        saveData();
    }
}

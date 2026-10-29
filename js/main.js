// --- INITIALIZATION & DYNAMIC UI BUILDERS ---

function buildLists() {
    // 1. Saving Throws
    const savesContainer = document.getElementById('savesList');
    savesContainer.innerHTML = '';
    attributes.forEach(attr => {
        savesContainer.innerHTML += `
            <div class="skill-row">
                <div class="skill-prof" id="saveProf_${attr}" onclick="toggleProf('saveProf_${attr}')"></div>
                <div class="skill-mod" id="saveVal_${attr}">+0</div>
                <div class="skill-name">${attr} Save</div>
            </div>`;
    });

    // 2. Skills
    const skillsContainer = document.getElementById('skillsList');
    skillsContainer.innerHTML = '';
    skillsData.forEach((skill, i) => {
        skillsContainer.innerHTML += `
            <div class="skill-row">
                <div class="skill-prof" id="skillProf_${i}" onclick="toggleProf('skillProf_${i}', true)"></div>
                <div class="skill-mod" id="skillVal_${i}">+0</div>
                <div class="skill-name">${skill.n} <span style="font-size:0.7rem; color:var(--text-muted)">(${skill.a})</span></div>
                <input type="number" class="skill-bonus-input" id="skillBonus_${i}" placeholder="+Misc" oninput="updateSheet()">
                <div class="skill-dis" id="skillDis_${i}" onclick="toggleDis(${i})" title="Toggle Disadvantage">D</div>
            </div>`;
    });

    // 3. Spell Slots & Special Points
    const slotContainer = document.getElementById('slotContainer');
    slotContainer.style.display = "grid";
    slotContainer.style.gridTemplateColumns = "repeat(5, 1fr)";
    slotContainer.style.gap = "10px";
    slotContainer.innerHTML = '';

    for (let i = 1; i <= 9; i++) {
        slotContainer.innerHTML += `
            <div class="slot-group">
                <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:bold;">
                    <span>Lvl ${i}</span>
                    <input type="number" id="slotMax_${i}" value="0" min="0" max="9" 
                        style="width:30px; background:transparent; border:none; text-align:right;" 
                        oninput="renderPips(${i}); saveData()">
                </div>
                <div class="pips" id="pips_${i}"></div>
            </div>`;
    }

    slotContainer.innerHTML += `
        <div class="slot-group" style="border-color:var(--accent); display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:0.7rem; font-weight:bold; color:var(--accent); text-align:center; margin-bottom:2px; white-space:nowrap;">Special Points</div>
            <div style="display:flex; justify-content:center; align-items:center; gap:2px;">
                <input type="number" id="specialPointsCurr" class="sheet-input" 
                    style="width:100%; text-align:center; font-weight:bold; color:var(--accent); font-size:0.9rem; padding:0;" 
                    placeholder="0" oninput="saveData()">
                <span style="color:var(--text-muted); font-size:0.8rem;">/</span>
                <input type="number" id="specialPointsMax" class="sheet-input" 
                    style="width:100%; text-align:center; font-size:0.9rem; padding:0;" 
                    placeholder="0" oninput="saveData()">
            </div>
        </div>
    `;
}

async function init() {
    buildLists();
    await loadData();
    updateRaceSelect();
    updateCatSelect();

    if (charClasses.length === 0) {
        charClasses.push({ name: '', level: 1 });
    }
    renderClassRows();

    updateSheet();
    renderInventory();
    renderFeats();
    renderSpellbook();
    renderTools();
    renderJournal();
    updateXP();
}

init();

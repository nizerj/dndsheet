// --- CORE STATS, CLASSES, RACES, XP & PROFICIENCIES ---

// --- CLASS MANAGEMENT ---
function renderClassRows() {
    const container = document.getElementById('classesContainer');
    container.innerHTML = '';

    let options = '<option value="">- Select -</option>';
    Object.keys(classesDB).forEach(c => {
        options += `<option value="${c}">${c}</option>`;
    });

    charClasses.forEach((cls, index) => {
        const row = document.createElement('div');
        row.className = 'class-row';
        row.innerHTML = `
            <select class="sheet-select" onchange="updateClassRow(${index}, 'name', this.value)">${options}</select>
            <input type="number" class="sheet-input" value="${cls.level}" min="1" 
                oninput="updateClassRow(${index}, 'level', this.value)" style="text-align:center;">
            ${index > 0 ? `<i class="ph ph-trash" style="cursor:pointer; color:var(--accent)" onclick="removeClassRow(${index})"></i>` : '<span></span>'}
        `;
        row.querySelector('select').value = cls.name;
        container.appendChild(row);
    });

    updateSheet();
}

function updateClassRow(index, field, value) {
    if (field === 'level') value = parseInt(value) || 1;
    charClasses[index][field] = value;
    updateSheet();
}

function addClassRow() {
    charClasses.push({ name: '', level: 1 });
    renderClassRows();
    saveData();
}

function removeClassRow(index) {
    charClasses.splice(index, 1);
    renderClassRows();
    saveData();
}

function openClassModal() {
    document.getElementById('classModal').classList.add('active');
}

function addCustomClass() {
    const name = document.getElementById('newClassName').value;
    const hd = document.getElementById('ncHD').value || "d8";
    if (!name) return;

    classesDB[name] = { hd: hd };
    renderClassRows();
    closeModal('classModal');
    saveData();
}

// --- RACE MANAGEMENT ---
function updateRaceSelect() {
    const raceSel = document.getElementById('charRace');
    const current = raceSel.value;
    raceSel.innerHTML = '<option value="">- Select -</option>';
    Object.keys(racesDB).forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.innerText = r;
        raceSel.appendChild(opt);
    });
    if (current) raceSel.value = current;
}

function updateRaceStats() {
    const race = document.getElementById('charRace').value;
    const r = racesDB[race] || {};
    attributes.forEach(attr => {
        const bonus = r[attr.toLowerCase()] || 0;
        document.getElementById(`raceMod${attr}`).value = bonus !== 0 ? bonus : '';
    });
    updateSheet();
}

function openRaceModal() {
    document.getElementById('raceModal').classList.add('active');
}

function addCustomRace() {
    const name = document.getElementById('newRaceName').value;
    if (!name) return;

    const r = {
        str: parseInt(document.getElementById('nrStr').value) || 0,
        dex: parseInt(document.getElementById('nrDex').value) || 0,
        con: parseInt(document.getElementById('nrCon').value) || 0,
        int: parseInt(document.getElementById('nrInt').value) || 0,
        wis: parseInt(document.getElementById('nrWis').value) || 0,
        cha: parseInt(document.getElementById('nrCha').value) || 0,
        speed: document.getElementById('nrSpeed').value
    };

    racesDB[name] = r;
    updateRaceSelect();
    document.getElementById('charRace').value = name;
    updateRaceStats();
    closeModal('raceModal');
    saveData();
}

// --- XP & INSPIRATION ---
function updateXP() {
    const xp = parseInt(document.getElementById('charXP').value) || 0;
    let lvl = 1;
    for (let i = 0; i < xpTable.length; i++) {
        if (xp >= xpTable[i]) lvl = i + 1;
    }

    const currentBase = xpTable[lvl - 1] || 0;
    const nextTarget = xpTable[lvl] || 355000;
    const progress = Math.min(100, Math.max(0, ((xp - currentBase) / (nextTarget - currentBase)) * 100));

    document.getElementById('xpBar').style.width = progress + "%";
    document.getElementById('xpText').innerText = `${xp} / ${nextTarget} (Lvl ${lvl})`;

    saveData();
}

function toggleInspiration() {
    inspiration = !inspiration;
    const el = document.getElementById('inspirationToggle');
    if (inspiration) el.classList.add('active');
    else el.classList.remove('active');
    saveData();
}

// --- PROFICIENCIES & DISADVANTAGES ---
function toggleProf(id, allowExpertise) {
    const el = document.getElementById(id);
    if (allowExpertise) {
        if (el.classList.contains('expertise')) {
            el.classList.remove('active', 'expertise');
            el.innerText = '';
        } else if (el.classList.contains('active')) {
            el.classList.add('expertise');
            el.innerText = 'E';
        } else {
            el.classList.add('active');
        }
    } else {
        el.classList.toggle('active');
    }
    updateSheet();
}

function toggleDis(i) {
    document.getElementById(`skillDis_${i}`).classList.toggle('active');
    saveData();
}

// --- SHEET CALCULATION ENGINE ---
function updateSheet() {
    document.getElementById('journalCharName').innerText = document.getElementById('charName').value;

    // Calculate Total Level & Hit Dice
    let totalLvl = 0;
    let hitDiceStr = [];
    charClasses.forEach(c => {
        const l = parseInt(c.level) || 0;
        totalLvl += l;
        if (c.name && classesDB[c.name]) {
            hitDiceStr.push(`${l}${classesDB[c.name].hd}`);
        }
    });
    if (totalLvl < 1) totalLvl = 1;

    document.getElementById('charLevel').value = totalLvl;
    document.getElementById('totalLevelDisplay').innerText = totalLvl;
    document.getElementById('hitDice').value = hitDiceStr.join(' + ');

    const prof = Math.ceil(totalLvl / 4) + 1;
    document.getElementById('dispProf').innerText = `+${prof}`;

    // Calculate Attribute Modifiers
    const mods = {};
    attributes.forEach(attr => {
        let score = parseInt(document.getElementById(`attr${attr}`).value) || 10;
        const raceVal = parseInt(document.getElementById(`raceMod${attr}`).value);
        if (!isNaN(raceVal)) score += raceVal;

        const mod = Math.floor((score - 10) / 2);
        mods[attr] = mod;
        document.getElementById(`mod${attr}`).innerText = mod >= 0 ? `+${mod}` : mod;
    });

    // Calculate Saving Throws
    attributes.forEach(attr => {
        const isProf = document.getElementById(`saveProf_${attr}`).classList.contains('active');
        document.getElementById(`saveVal_${attr}`).innerText = formatBonus(mods[attr] + (isProf ? prof : 0));
    });

    // Calculate Skills & Passive Perception
    skillsData.forEach((skill, i) => {
        const el = document.getElementById(`skillProf_${i}`);
        let bonus = mods[skill.a];
        if (el.classList.contains('active')) bonus += prof;
        if (el.classList.contains('expertise')) bonus += prof;

        const misc = parseInt(document.getElementById(`skillBonus_${i}`).value) || 0;
        bonus += misc;

        document.getElementById(`skillVal_${i}`).innerText = formatBonus(bonus);
        if (skill.n === 'Perception') {
            document.getElementById('dispPassivePerc').innerText = 10 + bonus;
        }
    });

    // Speed
    const raceVal = document.getElementById('charRace').value;
    const race = racesDB[raceVal];
    const rawSpeed = race ? race.speed : 30;
    document.getElementById('dispSpeed').innerText = formatDist(rawSpeed);

    // Armor Class
    updateAC(mods.Dex);

    // Spellcasting DC & Attack
    const castStat = document.getElementById('spellAbility').value;
    const formattedStat = castStat.charAt(0).toUpperCase() + castStat.slice(1);
    const castMod = mods[formattedStat] || 0;
    document.getElementById('spellAtk').value = formatBonus(castMod + prof);
    document.getElementById('spellDC').value = 8 + castMod + prof;

    // Initiative
    const initMisc = parseInt(document.getElementById('valInitMisc').value) || 0;
    const totalInit = mods.Dex + initMisc;
    document.getElementById('dispInit').innerText = formatBonus(totalInit);

    updateEncumbrance();
    saveData();
    return mods;
}

// --- PERSISTENCE: LOCALSTORAGE, INDEXEDDB & JSON IO ---

function saveData() {
    const data = {};
    document.querySelectorAll('input, textarea, select').forEach(el => {
        if (
            el.id &&
            !el.id.startsWith('new') &&
            !el.id.startsWith('nr') &&
            !el.id.startsWith('nf') &&
            !el.id.startsWith('ns') &&
            !el.id.startsWith('nc') &&
            !el.id.startsWith('nt') &&
            !el.classList.contains('atk-name') &&
            el.type !== 'file' &&
            !el.classList.contains('comp-input') &&
            !el.classList.contains('journal-title-input')
        ) {
            data[el.id] = el.type === 'checkbox' ? el.checked : el.value;
        }
    });

    data.charClasses = charClasses;
    data.journal = journal;

    // Offload heavy images to IndexedDB, save references to LocalStorage
    data.statImages = statImages.map((img, i) => {
        if (img.src && img.src.startsWith('data:image')) {
            DB.save(`statImg_${i}`, img.src);
            return { ...img, src: `DB:statImg_${i}` };
        }
        return img;
    });

    const avatarSrc = document.getElementById('avatarImg').src;
    if (avatarSrc.startsWith('data:image') && avatarSrc.length > 1000) {
        DB.save('avatarImg', avatarSrc);
        data.avatar = 'DB:avatarImg';
    } else {
        data.avatar = avatarSrc;
    }

    data.proficiencies = {};
    document.querySelectorAll('.skill-prof').forEach(el => {
        data.proficiencies[el.id] = {
            active: el.classList.contains('active'),
            expertise: el.classList.contains('expertise')
        };
    });

    data.disadvantages = {};
    document.querySelectorAll('.skill-dis').forEach(el => {
        if (el.classList.contains('active')) data.disadvantages[el.id] = true;
    });

    data.pips = {};
    for (let i = 1; i <= 9; i++) {
        const c = document.getElementById(`pips_${i}`);
        if (c) data.pips[`slot_${i}`] = Array.from(c.children).filter(x => x.classList.contains('used')).length;
    }

    const dsSuccess = document.getElementById('dsSuccessPips');
    const dsFail = document.getElementById('dsFailPips');
    if (dsSuccess) data.dsSuccess = Array.from(dsSuccess.children).filter(x => x.classList.contains('used')).length;
    if (dsFail) data.dsFail = Array.from(dsFail.children).filter(x => x.classList.contains('used')).length;

    data.inventory = inventory;
    data.itemCategories = itemCategories;
    data.racesDB = racesDB;
    data.classesDB = classesDB;
    data.feats = feats;
    data.spells = spells;
    data.tools = tools;

    data.attacks = [];
    document.querySelectorAll('.attack-row').forEach(row => {
        data.attacks.push({
            n: row.querySelector('.atk-name').value,
            a: row.querySelector('.atk-bonus').value,
            d: row.querySelector('.atk-dmg').value,
            sel: row.querySelector('.item-select').value,
            db: row.querySelector('.atk-dmg-bonus').value
        });
    });

    data.inspiration = inspiration;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function loadData() {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return;

    const data = JSON.parse(json);
    if (data.racesDB) racesDB = data.racesDB;
    if (data.classesDB) classesDB = data.classesDB;

    updateRaceSelect();
    const savedArmorVal = data.equippedArmor || "";

    const excludedKeys = [
        'inventory', 'itemCategories', 'attacks', 'feats', 'spells',
        'proficiencies', 'pips', 'racesDB', 'classesDB', 'avatar',
        'tools', 'charClasses', 'journal', 'statImages'
    ];

    for (const [key, value] of Object.entries(data)) {
        const el = document.getElementById(key);
        if (el && !excludedKeys.includes(key)) {
            el.type === 'checkbox' ? el.checked = value : el.value = value;
        }
    }

    if (data.charClasses && Array.isArray(data.charClasses)) {
        charClasses = data.charClasses;
    } else if (data.charClass) {
        charClasses = [{ name: data.charClass, level: data.charLevel || 1 }];
    }

    if (data.journal && Array.isArray(data.journal)) {
        journal = data.journal;
        renderJournal();
    }

    // Async Image Rehydration from IndexedDB
    if (data.statImages && Array.isArray(data.statImages)) {
        statImages = data.statImages;
        for (let img of statImages) {
            if (img.src && img.src.startsWith('DB:')) {
                const dbSrc = await DB.get(img.src.split(':')[1]);
                if (dbSrc) img.src = dbSrc;
            }
        }
        renderStatImages();
    }

    if (data.avatar) {
        if (data.avatar.startsWith('DB:')) {
            const dbAvatar = await DB.get(data.avatar.split(':')[1]);
            if (dbAvatar) document.getElementById('avatarImg').src = dbAvatar;
        } else if (data.avatar.length > 100) {
            document.getElementById('avatarImg').src = data.avatar;
        }
    }

    if (data.proficiencies) {
        for (const [key, state] of Object.entries(data.proficiencies)) {
            const el = document.getElementById(key);
            if (el) {
                if (state.active) el.classList.add('active');
                if (state.expertise) {
                    el.classList.add('expertise');
                    el.innerText = 'E';
                }
            }
        }
    }

    if (data.disadvantages) {
        for (const [id, active] of Object.entries(data.disadvantages)) {
            const el = document.getElementById(id);
            if (el && active) el.classList.add('active');
        }
    }

    if (data.itemCategories) {
        itemCategories = data.itemCategories;
        updateCatSelect();
    }
    if (data.inventory) {
        inventory = data.inventory;
        renderInventory();
        updateCombatOptions();
        if (savedArmorVal !== "") {
            const armorEl = document.getElementById('equippedArmor');
            if (armorEl) armorEl.value = savedArmorVal;
        }
    }
    if (data.feats) {
        feats = data.feats;
        renderFeats();
    }
    if (data.spells) {
        spells = data.spells;
        renderSpellbook();
    }
    if (data.tools) {
        tools = data.tools;
        renderTools();
    }

    if (data.attacks) {
        document.getElementById('attacksContainer').innerHTML = '';
        data.attacks.forEach(atk => addAttack(atk.n, atk.a, atk.d, atk.sel, atk.db));
    }

    for (let i = 1; i <= 9; i++) {
        renderPips(i);
        const count = data.pips ? (data.pips[`slot_${i}`] || 0) : 0;
        const c = document.getElementById(`pips_${i}`);
        if (c) {
            for (let j = 0; j < count; j++) {
                if (c.children[j]) c.children[j].classList.add('used');
            }
        }
    }

    const dsSuccess = document.getElementById('dsSuccessPips');
    const dsFail = document.getElementById('dsFailPips');
    if (data.dsSuccess && dsSuccess) {
        for (let i = 0; i < data.dsSuccess; i++) {
            if (dsSuccess.children[i]) dsSuccess.children[i].classList.add('used');
        }
    }
    if (data.dsFail && dsFail) {
        for (let i = 0; i < data.dsFail; i++) {
            if (dsFail.children[i]) dsFail.children[i].classList.add('used');
        }
    }

    useMetric = document.getElementById('unitToggle').checked;
    inspiration = data.inspiration || false;
    if (inspiration) document.getElementById('inspirationToggle').classList.add('active');

    updateSheet();
}

async function resetData() {
    await DB.clear();
    localStorage.removeItem(STORAGE_KEY);

    // 1. Reset Internal State
    inventory = [];
    feats = [];
    spells = [];
    tools = [];
    charClasses = [{ name: '', level: 1 }];
    journal = [];
    statImages = [];
    inspiration = false;
    itemCategories = getInitialItemCategories();

    // 2. Reset Custom Definitions
    racesDB = getInitialRaces();
    classesDB = getInitialClasses();

    // 3. Reset Inputs
    const defaults = {
        'charName': '', 'charBackground': '', 'charSubclass': '', 'charXP': 0, 'charRace': '',
        'attrStr': 10, 'attrDex': 10, 'attrCon': 10, 'attrInt': 10, 'attrWis': 10, 'attrCha': 10,
        'raceModStr': '', 'raceModDex': '', 'raceModCon': '', 'raceModInt': '', 'raceModWis': '', 'raceModCha': '',
        'valAC': 10, 'valInitMisc': 0, 'hpCurr': 10, 'hpMax': 10, 'hitDice': '',
        'combatNotes': '', 'currGP': '', 'currSP': '', 'currCP': '',
        'bioAge': '', 'bioHeight': '', 'bioWeight': '', 'bioEyes': '', 'bioSkin': '', 'bioHair': '',
        'bioPersonality': '', 'bioIdeals': '', 'bioBonds': '', 'bioFlaws': '',
        'bioLanguages': '', 'bioAllies': '', 'bioNotes': '',
        'spellAbility': 'int', 'equippedArmor': '', 'acSecStat': '',
        'specialPointsCurr': '', 'specialPointsMax': '', 'spCurr': 0, 'spMax': 0, 'acMisc': 0
    };

    for (const [id, val] of Object.entries(defaults)) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }

    // 4. Reset Checkboxes
    document.getElementById('unitToggle').checked = false;

    // 5. Clear Visual Elements
    document.querySelectorAll('.skill-prof').forEach(el => {
        el.classList.remove('active', 'expertise');
        el.innerText = '';
    });

    document.querySelectorAll('.skill-bonus-input').forEach(el => el.value = '');
    document.querySelectorAll('.skill-dis').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.pip').forEach(el => el.classList.remove('used'));

    for (let i = 1; i <= 9; i++) {
        document.getElementById(`slotMax_${i}`).value = 0;
        renderPips(i);
    }

    document.getElementById('attacksContainer').innerHTML = '';
    document.getElementById('journalContainer').innerHTML = '';
    document.getElementById('statBlocksContainer').innerHTML = '';
    document.getElementById('inspirationToggle').classList.remove('active');

    // 6. Reset Avatar
    document.getElementById('avatarImg').src = DEFAULT_AVATAR_SVG;

    // 7. Re-render UI
    updateRaceSelect();
    updateCatSelect();
    renderClassRows();
    renderInventory();
    renderFeats();
    renderSpellbook();
    renderTools();
    renderJournal();
    toggleUnits();
    updateSheet();
    updateXP();

    showPopup("Sheet reset.");
}

// --- JSON IMPORT / EXPORT ---
async function exportJSON() {
    saveData();
    const dataStr = localStorage.getItem(STORAGE_KEY);
    if (!dataStr) {
        showPopup("No data to export");
        return;
    }

    const data = JSON.parse(dataStr);

    if (data.avatar && data.avatar.startsWith('DB:')) {
        const dbAvatar = await DB.get(data.avatar.split(':')[1]);
        if (dbAvatar) data.avatar = dbAvatar;
    }
    if (data.statImages) {
        for (let img of data.statImages) {
            if (img.src && img.src.startsWith('DB:')) {
                const dbSrc = await DB.get(img.src.split(':')[1]);
                if (dbSrc) img.src = dbSrc;
            }
        }
    }

    const blob = new Blob([JSON.stringify(data, null, 4)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `character_${document.getElementById('charName').value || 'sheet'}.json`;
    a.click();
}

function importJSON(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const data = JSON.parse(e.target.result);

            if (data.avatar && data.avatar.startsWith('data:image') && data.avatar.length > 1000) {
                await DB.save('avatarImg', data.avatar);
                data.avatar = 'DB:avatarImg';
            }
            if (data.statImages) {
                for (let i = 0; i < data.statImages.length; i++) {
                    let img = data.statImages[i];
                    if (img.src && img.src.startsWith('data:image')) {
                        await DB.save(`statImg_${i}`, img.src);
                        img.src = `DB:statImg_${i}`;
                    }
                }
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            location.reload();
        } catch (err) {
            showPopup("Invalid JSON file");
        }
    };
    reader.readAsText(file);
}

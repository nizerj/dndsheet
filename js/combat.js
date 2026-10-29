// --- COMBAT, AC, INITIATIVE, HP & ATTACKS ---

function updateAC(dexMod) {
    if (dexMod === undefined) {
        const modText = document.getElementById('modDex').innerText;
        dexMod = parseInt(modText) || 0;
    }

    const secStat = document.getElementById('acSecStat').value;
    let secMod = 0;
    if (secStat) {
        const modText = document.getElementById(`mod${secStat}`).innerText;
        secMod = parseInt(modText) || 0;
    }

    const misc = parseInt(document.getElementById('acMisc').value) || 0;
    const equipSelect = document.getElementById('equippedArmor');
    const idx = equipSelect.value;

    let calcAC = 0;

    if (idx !== "") {
        const item = inventory[idx];
        if (item && item.cat === 'Armor') {
            const base = parseInt(item.ac) || 10;
            const type = item.armorType;

            if (type === 'Light') {
                calcAC = base + dexMod + secMod + misc;
            } else if (type === 'Medium') {
                calcAC = base + Math.min(dexMod, 2) + secMod + misc;
            } else if (type === 'Heavy') {
                calcAC = base + secMod + misc;
            } else if (type === 'Shield') {
                let shieldBonus = 2;
                if (base > 10) shieldBonus = base - 10;
                else if (base > 0 && base < 10) shieldBonus = base;

                calcAC = 10 + dexMod + shieldBonus + secMod + misc;
            }
        }
    } else {
        calcAC = 10 + dexMod + secMod + misc;
    }

    document.getElementById('valAC').value = calcAC;
}

function rollInitiative() {
    const totalStr = document.getElementById('dispInit').innerText;
    const total = parseInt(totalStr) || 0;
    const roll = Math.floor(Math.random() * 20) + 1;
    const final = roll + total;
    const msg = `Initiative Roll:\n\nD20 (${roll}) + Init (${formatBonus(total)}) = ${final}`;
    showPopup(msg);
}

function togglePip(el) {
    el.classList.toggle('used');
    saveData();
}

function modHP(amount) {
    document.getElementById('hpCurr').value = (parseInt(document.getElementById('hpCurr').value) || 0) + amount;
    saveData();
}

function restHP() {
    document.getElementById('hpCurr').value = document.getElementById('hpMax').value;
    resetSlots();
    showPopup("Short Rest taken. HP restored to max.");
    saveData();
}

// --- ATTACKS & AMMO ---
function updateCombatOptions() {
    const armorSel = document.getElementById('equippedArmor');
    const currentVal = armorSel.value;
    armorSel.innerHTML = '<option value="">No Armor</option>';

    inventory.forEach((item, idx) => {
        if (item.cat === 'Armor') {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.innerText = item.n;
            armorSel.appendChild(opt);
        }
    });
    armorSel.value = currentVal;

    document.querySelectorAll('.item-select').forEach(sel => {
        const val = sel.value;
        sel.innerHTML = '<option value="">- Custom -</option>';
        inventory.forEach((item, idx) => {
            if (item.cat === 'Weapon' || item.isFocus) {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.innerText = item.n;
                sel.appendChild(opt);
            }
        });
        if (val) sel.value = val;
    });
    updateAC();
}

function addAttack(name = '', bonus = '', dmg = '', selIndex = '', dmgBonus = '') {
    const container = document.getElementById('attacksContainer');
    const div = document.createElement('div');
    div.className = 'attack-row';

    let options = '<option value="">- Custom -</option>';
    inventory.forEach((item, index) => {
        if (item.cat === 'Weapon' || item.isFocus) {
            options += `<option value="${index}">${item.n}</option>`;
        }
    });

    div.innerHTML = `
        <select class="sheet-select item-select" onchange="fillAttack(this)" 
                style="font-size:0.8rem; color:var(--accent);">${options}</select>
        <input type="text" placeholder="Name" class="sheet-input atk-name" value="${name}" oninput="saveData()">
        <input type="text" placeholder="+Atk" class="sheet-input atk-bonus" value="${bonus}" 
            style="text-align:center" oninput="saveData()">
        <input type="text" placeholder="Dmg" class="sheet-input atk-dmg" value="${dmg}" oninput="saveData()">
        <input type="text" placeholder="+0" class="sheet-input atk-dmg-bonus" value="${dmgBonus}" 
            style="text-align:center; font-size:0.8rem; color:var(--accent)" oninput="saveData()" title="Damage Bonus">
        <button class="btn-fire" onclick="fireAmmo(this)" title="Use Ammo"><i class="ph ph-crosshair"></i></button>
        <i class="ph ph-trash btn-del" onclick="this.parentElement.remove(); saveData()"></i>
    `;

    if (selIndex !== "" && selIndex !== undefined) {
        const sel = div.querySelector('.item-select');
        sel.value = selIndex;
        fillAttack(sel, true);
    }

    container.appendChild(div);
    saveData();
}

function fillAttack(select, skipSave = false) {
    const idx = select.value;
    const row = select.parentElement;
    const fireBtn = row.querySelector('.btn-fire');

    if (idx === "") {
        fireBtn.classList.remove('visible');
        return;
    }

    const item = inventory[idx];

    if (!skipSave) {
        row.querySelector('.atk-name').value = item.n;
        row.querySelector('.atk-dmg').value = item.dmg || "";
        const mods = updateSheet();
        const lvl = parseInt(document.getElementById('charLevel').value) || 1;
        const prof = Math.ceil(lvl / 4) + 1;
        let statMod = mods.Str;
        if (item.finesse && mods.Dex > mods.Str) statMod = mods.Dex;
        if (item.ranged) statMod = mods.Dex;

        let totalBonus = statMod;
        if (item.prof) totalBonus += prof;

        row.querySelector('.atk-bonus').value = formatBonus(totalBonus);
        saveData();
    }

    if (item && item.ranged && item.ammo) {
        fireBtn.classList.add('visible');
        fireBtn.setAttribute('data-ammo', item.ammo);
    } else {
        fireBtn.classList.remove('visible');
    }
}

function fireAmmo(btn) {
    const ammoName = btn.getAttribute('data-ammo');
    if (!ammoName) return;

    const ammoItem = inventory.find(i => i.n === ammoName);
    if (ammoItem) {
        if (ammoItem.q > 0) {
            ammoItem.q--;
            renderInventory();
            showPopup(`Used 1 ${ammoName}. Remaining: ${ammoItem.q}`);
            saveData();
        } else {
            showPopup(`Out of ${ammoName}!`);
        }
    } else {
        showPopup(`Ammo item "${ammoName}" not found in inventory.`);
    }
}

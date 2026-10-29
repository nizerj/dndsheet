// --- INVENTORY, TOOLS, CURRENCY & ENCUMBRANCE ---

// --- TOOLS ---
function openToolModal() {
    document.getElementById('toolModal').classList.add('active');
    document.getElementById('ntName').focus();
}

function addToolFromModal() {
    const name = document.getElementById('ntName').value;
    if (name) {
        tools.push(name);
        renderTools();
        saveData();
        closeModal('toolModal');
        document.getElementById('ntName').value = '';
    }
}

function renderTools() {
    const list = document.getElementById('toolsList');
    list.innerHTML = "";
    tools.forEach((t, i) => {
        const div = document.createElement('div');
        div.className = 'tool-row';
        div.innerHTML = `
            <span style="flex:1">${t}</span>
            <i class="ph ph-trash btn-del" onclick="tools.splice(${i},1); renderTools(); saveData()"></i>
        `;
        list.appendChild(div);
    });
}

// --- ITEM CATEGORIES ---
function updateCatSelect() {
    const sel = document.getElementById('newItemCat');
    const current = sel.value;
    sel.innerHTML = '';
    itemCategories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.innerText = c;
        sel.appendChild(opt);
    });
    if (current) sel.value = current;
}

function addCategory() {
    document.getElementById('catModal').classList.add('active');
    document.getElementById('newCatNameInput').value = '';
    document.getElementById('newCatNameInput').focus();
}

function confirmAddCategory() {
    const newCat = document.getElementById('newCatNameInput').value;
    if (newCat && !itemCategories.includes(newCat)) {
        itemCategories.push(newCat);
        updateCatSelect();
        document.getElementById('newItemCat').value = newCat;
        saveData();
    }
    closeModal('catModal');
}

// --- ITEM MODAL & CRUD ---
function toggleAmmoSelect() {
    const isRanged = document.getElementById('newItemRanged').checked;
    const ammoSel = document.getElementById('newItemAmmo');
    if (isRanged) ammoSel.classList.remove('hidden');
    else ammoSel.classList.add('hidden');
}

function toggleItemFields() {
    const cat = document.getElementById('newItemCat').value;
    document.getElementById('armorFields').classList.add('hidden');
    document.getElementById('weaponFields').classList.add('hidden');
    if (cat === 'Armor') document.getElementById('armorFields').classList.remove('hidden');
    if (cat === 'Weapon') document.getElementById('weaponFields').classList.remove('hidden');
}

function openItemModal() {
    editingItemIndex = null;
    document.getElementById('itemModal').classList.add('active');
    if (document.getElementById('newItemCat').options.length === 0) updateCatSelect();

    const ammoSel = document.getElementById('newItemAmmo');
    ammoSel.innerHTML = '<option value="">- Select Ammo Item -</option>';
    inventory.forEach(i => {
        const opt = document.createElement('option');
        opt.value = i.n;
        opt.innerText = i.n;
        ammoSel.appendChild(opt);
    });

    document.getElementById('newItemName').value = '';
    document.getElementById('newItemWeight').value = '0';
    document.getElementById('newItemQty').value = '1';
    document.getElementById('newItemCost').value = '0';
    document.getElementById('newItemCurrency').value = 'gp';
    document.getElementById('newItemNotes').value = '';
    document.getElementById('newItemAC').value = '';
    document.getElementById('newItemDmg').value = '';
    document.getElementById('newItemPurchased').checked = false;
    document.getElementById('newItemFinesse').checked = false;
    document.getElementById('newItemRanged').checked = false;
    document.getElementById('newItemAmmo').classList.add('hidden');
    document.getElementById('newItemAmmo').value = '';

    const chk = document.getElementById('newItemMetric');
    chk.checked = useMetric;
    toggleModalUnit();

    toggleItemFields();
}

function editItem(index) {
    editingItemIndex = index;
    const item = inventory[index];
    document.getElementById('itemModal').classList.add('active');
    if (document.getElementById('newItemCat').options.length === 0) updateCatSelect();

    const ammoSel = document.getElementById('newItemAmmo');
    ammoSel.innerHTML = '<option value="">- Select Ammo Item -</option>';
    inventory.forEach(i => {
        if (i.n === item.n) return;
        const opt = document.createElement('option');
        opt.value = i.n;
        opt.innerText = i.n;
        ammoSel.appendChild(opt);
    });

    document.getElementById('newItemName').value = item.n;
    document.getElementById('newItemCat').value = item.cat;

    const chk = document.getElementById('newItemMetric');
    chk.checked = useMetric;
    toggleModalUnit();

    let displayW = item.w;
    if (useMetric) displayW = item.w * 0.5;

    document.getElementById('newItemWeight').value = parseFloat(displayW.toFixed(1));
    document.getElementById('newItemQty').value = item.q;
    document.getElementById('newItemCost').value = item.cost;
    document.getElementById('newItemCurrency').value = item.currency || 'gp';
    document.getElementById('newItemNotes').value = item.note;
    document.getElementById('newItemProf').checked = item.prof;
    document.getElementById('newItemFocus').checked = item.isFocus || false;
    document.getElementById('newItemPurchased').checked = false;

    if (item.cat === 'Armor') {
        document.getElementById('newItemAC').value = item.ac || '';
        document.getElementById('newItemArmorType').value = item.armorType || 'Light';
    }
    if (item.cat === 'Weapon') {
        document.getElementById('newItemDmg').value = item.dmg || '';
        document.getElementById('newItemFinesse').checked = item.finesse || false;
        document.getElementById('newItemRanged').checked = item.ranged || false;
        if (item.ranged) {
            ammoSel.classList.remove('hidden');
            ammoSel.value = item.ammo || '';
        } else {
            ammoSel.classList.add('hidden');
        }
    } else {
        document.getElementById('newItemRanged').checked = false;
        ammoSel.classList.add('hidden');
    }

    toggleItemFields();
}

function addItemFromModal() {
    const name = document.getElementById('newItemName').value;
    if (!name) {
        showPopup("Item name required");
        return;
    }
    const cat = document.getElementById('newItemCat').value;
    const prof = document.getElementById('newItemProf').checked;
    const isFocus = document.getElementById('newItemFocus').checked;
    const isMetric = document.getElementById('newItemMetric').checked;
    const isPurchased = document.getElementById('newItemPurchased').checked;
    let w = parseFloat(document.getElementById('newItemWeight').value) || 0;

    // Internal storage is ALWAYS LBS
    if (isMetric) w = w * 2.0;

    const qty = parseInt(document.getElementById('newItemQty').value) || 1;
    const costPer = parseFloat(document.getElementById('newItemCost').value) || 0;
    const currency = document.getElementById('newItemCurrency').value || 'gp';

    // Handle Purchase Logic
    if (isPurchased && costPer > 0) {
        let cp = parseInt(document.getElementById('currCP').value) || 0;
        let sp = parseInt(document.getElementById('currSP').value) || 0;
        let gp = parseInt(document.getElementById('currGP').value) || 0;
        let totalPlayerCP = cp + (sp * 10) + (gp * 100);

        let itemCostCP = costPer * qty;
        if (currency === 'gp') itemCostCP *= 100;
        if (currency === 'sp') itemCostCP *= 10;

        if (totalPlayerCP < itemCostCP) {
            showPopup("Not enough money to purchase!");
            return;
        }

        totalPlayerCP -= itemCostCP;

        let newGP = Math.floor(totalPlayerCP / 100);
        totalPlayerCP %= 100;

        let newSP = Math.floor(totalPlayerCP / 10);
        totalPlayerCP %= 10;
        let newCP = totalPlayerCP;

        document.getElementById('currGP').value = newGP;
        document.getElementById('currSP').value = newSP;
        document.getElementById('currCP').value = newCP;
    }

    const item = {
        n: name,
        cat: cat,
        w: w,
        q: qty,
        cost: costPer,
        currency: currency,
        note: document.getElementById('newItemNotes').value,
        prof: prof,
        isFocus: isFocus
    };

    if (cat === 'Armor') {
        item.ac = document.getElementById('newItemAC').value;
        item.armorType = document.getElementById('newItemArmorType').value;
    }
    if (cat === 'Weapon') {
        item.dmg = document.getElementById('newItemDmg').value;
        item.finesse = document.getElementById('newItemFinesse').checked;
        item.ranged = document.getElementById('newItemRanged').checked;
        if (item.ranged) {
            item.ammo = document.getElementById('newItemAmmo').value;
        }
    }

    if (editingItemIndex !== null) {
        inventory[editingItemIndex] = item;
    } else {
        inventory.push(item);
    }

    renderInventory();
    updateCombatOptions();
    closeModal('itemModal');
    saveData();
}

function removeItem(index) {
    showConfirm("Delete item?", () => {
        inventory.splice(index, 1);
        renderInventory();
        updateCombatOptions();
        saveData();
    });
}

function modItemQty(index, amount, event) {
    if (event) event.stopPropagation();
    const item = inventory[index];
    item.q = (parseInt(item.q) || 0) + amount;
    if (item.q < 0) item.q = 0;
    renderInventory();
    saveData();
}

function renderInventory() {
    const container = document.getElementById('invListContainer');
    container.innerHTML = '';

    const groups = {};
    itemCategories.forEach(c => groups[c] = []);
    groups['Uncategorized'] = [];

    inventory.forEach((item, index) => {
        item._idx = index;
        groups[item.cat] ? groups[item.cat].push(item) : groups['Uncategorized'].push(item);
    });

    for (const [catName, items] of Object.entries(groups)) {
        if (items.length === 0) continue;
        const header = document.createElement('div');
        header.className = 'inv-cat-header';
        header.innerText = catName;
        container.appendChild(header);

        items.forEach(item => {
            let details = [];
            if (item.cat === 'Armor') details.push(`AC ${item.ac}`);
            if (item.cat === 'Weapon') details.push(convertText(item.dmg));
            if (item.cost > 0) details.push(`${item.cost}${item.currency || 'gp'}`);

            const entryDiv = document.createElement('div');
            entryDiv.className = 'inv-entry';

            let tags = '';
            if (item.prof) tags += '<span class="prof-tag">PROF</span>';
            if (item.ranged) tags += '<span class="prof-tag" style="background:var(--dex)">Ranged</span>';

            entryDiv.innerHTML = `
                <div class="inv-row" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div style="flex:1">
                        <div class="inv-top"><b>${item.n}</b> ${tags}</div>
                        <div class="inv-sub">${details.join(' • ')}</div>
                    </div>
                    <div class="inv-stat">${formatWgt(item.w)}</div>
                    <div class="inv-stat qty-box">
                        <button class="qty-btn-mini" onclick="modItemQty(${item._idx}, -1, event)">-</button>
                        <span style="min-width:20px;">${item.q}</span>
                        <button class="qty-btn-mini" onclick="modItemQty(${item._idx}, 1, event)">+</button>
                    </div>
                    <div class="btn-edit" onclick="event.stopPropagation(); editItem(${item._idx})">
                        <i class="ph ph-pencil-simple"></i>
                    </div>
                    <div class="btn-del" onclick="event.stopPropagation(); removeItem(${item._idx})">
                        <i class="ph ph-trash"></i>
                    </div>
                </div>
                ${item.note ? `<div class="inv-note hidden">${convertText(item.note)}</div>` : '<div class="hidden"></div>'}
            `;
            container.appendChild(entryDiv);
        });
    }
    updateEncumbrance();
}

// --- COINS & ENCUMBRANCE ---
function consolidateCoins() {
    let cp = parseInt(document.getElementById('currCP').value) || 0;
    let sp = parseInt(document.getElementById('currSP').value) || 0;
    let gp = parseInt(document.getElementById('currGP').value) || 0;

    let totalCP = cp + (sp * 10) + (gp * 100);

    let newGP = Math.floor(totalCP / 100);
    totalCP %= 100;
    let newSP = Math.floor(totalCP / 10);
    totalCP %= 10;
    let newCP = totalCP;

    document.getElementById('currGP').value = newGP;
    document.getElementById('currSP').value = newSP;
    document.getElementById('currCP').value = newCP;

    saveData();
    updateEncumbrance();
    showPopup(`Consolidated to ${newGP}gp, ${newSP}sp, ${newCP}cp`);
}

function updateEncumbrance() {
    let score = parseInt(document.getElementById('attrStr').value) || 10;
    const raceVal = parseInt(document.getElementById('raceModStr').value);
    if (!isNaN(raceVal)) score += raceVal;

    const maxLoad = score * 15;
    let currentLoad = 0;
    inventory.forEach(i => currentLoad += (i.w * i.q));

    const coins = (parseInt(document.getElementById('currGP').value) || 0)
        + (parseInt(document.getElementById('currSP').value) || 0)
        + (parseInt(document.getElementById('currCP').value) || 0);

    currentLoad += coins / 50;
    const bar = document.getElementById('encBar');
    const pct = Math.min((currentLoad / maxLoad) * 100, 100);
    bar.style.width = `${pct}%`;

    document.getElementById('encText').innerHTML =
        `<strong>${formatWgt(currentLoad.toFixed(2))}</strong> / ${formatWgt(maxLoad)}`;

    if (currentLoad > maxLoad) bar.style.background = '#ef4444';
    else bar.style.background = 'var(--border)';
}

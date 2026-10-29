// --- PDF EXPORT (PDFLib) ---

async function fillPDF(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const arrayBuffer = await file.arrayBuffer();

    try {
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const form = pdfDoc.getForm();

        // 1. Embed Font
        const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

        // 2. Text Sanitizer
        const cleanText = (val) => {
            if (val === null || val === undefined) return "";
            return String(val)
                .replace(/<r>/g, "")
                .replace(/<\/r>/g, "")
                .replace(/\*\*/g, "")
                .replace(/\uf0b7/g, "- ")
                .replace(/\u2022/g, "- ")
                .replace(/\u2023/g, "- ")
                .replace(//g, "- ")
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n");
        };

        // 3. Smart Field Helper (Context-Aware Shrinking)
        const fill = (baseName, val, defaultSize = 10, isLargeBox = false) => {
            const strVal = cleanText(val);

            const candidates = [
                baseName,
                baseName + " ",
                baseName.replace(" 2", "  2"),
                baseName.replace(" ", "  "),
                `ST ${baseName}`,
                baseName.replace(' ', ''),
                baseName.replace(' ', '_'),
                baseName.toUpperCase(),
                `Skill ${baseName}`,
                `${baseName}Save`,
                baseName === "Allies" ? "Allies & Organizations" : null,
                baseName === "AdditionalFeatures" ? "ADDITIONAL FEATURES & TRAITS" : null
            ].filter(Boolean);

            for (const name of candidates) {
                try {
                    const field = form.getTextField(name);
                    if (field) {
                        field.updateAppearances(helvetica);
                        field.setText(strVal);

                        try {
                            if (field.isMultiline()) {
                                const len = strVal.length;
                                let size = defaultSize;

                                if (isLargeBox) {
                                    if (len > 3000) size = 6;
                                    else if (len > 2200) size = 7;
                                    else if (len > 1500) size = 8;
                                    else if (len > 850) size = 9;
                                } else {
                                    if (len > 350) size = 5;
                                    else if (len > 250) size = 6;
                                    else if (len > 140) size = 7;
                                    else if (len > 110) size = 8;
                                    else if (len > 70) size = 9;
                                }
                                field.setFontSize(size);
                            } else {
                                const widgets = field.getWidgets();
                                if (widgets.length > 0) {
                                    const rect = widgets[0].getRectangle();
                                    const availableWidth = rect.width - 25;
                                    const textWidth = helvetica.widthOfTextAtSize(strVal, defaultSize);

                                    if (textWidth > availableWidth) {
                                        let newSize = (availableWidth / textWidth) * defaultSize;
                                        newSize = Math.max(Math.floor(newSize * 10) / 10, 6);
                                        field.setFontSize(newSize);
                                    } else {
                                        field.setFontSize(defaultSize);
                                    }
                                } else {
                                    field.setFontSize(defaultSize);
                                }
                            }
                        } catch (calcErr) {
                            field.setFontSize(defaultSize);
                        }
                        return;
                    }
                } catch (e) {}
            }
        };

        const check = (baseName) => {
            const candidates = [
                baseName,
                baseName.replace('Check Box', 'CheckBox'),
                baseName.replace(' ', ''),
                baseName.replace(/ /g, '_')
            ];
            for (const name of candidates) {
                try {
                    const field = form.getCheckBox(name);
                    if (field) {
                        field.check();
                        return;
                    }
                } catch (e) {}
            }
        };

        // 4. Core Info
        fill('CharacterName', document.getElementById('charName').value, 16);
        fill('CharacterName 2', document.getElementById('charName').value);
        fill('PlayerName', document.getElementById('charName').value);
        fill('Race ', document.getElementById('charRace').value);
        fill('Background', document.getElementById('charBackground').value);
        fill('XP', document.getElementById('charXP').value);
        fill('Inspiration', inspiration ? "1" : "");

        let classStr = charClasses.map(c => `${c.name} ${c.level}`).join(' / ');
        fill('ClassLevel', classStr);

        // 5. Attributes & Saves
        const stats = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];
        const pdfStatNames = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
        const fullStatNames = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
        const saveBoxMap = {
            'Str': 'Check Box 11',
            'Dex': 'Check Box 18',
            'Con': 'Check Box 19',
            'Int': 'Check Box 20',
            'Wis': 'Check Box 21',
            'Cha': 'Check Box 22'
        };

        stats.forEach((stat, i) => {
            let score = parseInt(document.getElementById(`attr${stat}`).value) || 10;
            const raceEl = document.getElementById(`raceMod${stat}`);
            const raceText = raceEl ? (raceEl.value || raceEl.innerText) : '';
            if (raceText) {
                const parsedBonus = parseInt(String(raceText).replace('+', ''));
                if (!isNaN(parsedBonus)) score += parsedBonus;
            }
            fill(pdfStatNames[i], score, 16);

            const mod = Math.floor((score - 10) / 2);
            const modStr = mod >= 0 ? `+${mod}` : mod;
            if (stat === 'Cha') {
                fill('CHamod', modStr, 12);
                fill('CHAmod', modStr, 12);
            } else {
                fill(`${pdfStatNames[i]}mod`, modStr, 12);
            }

            fill(`ST ${fullStatNames[i]}`, document.getElementById(`saveVal_${stat}`).innerText, 10);
            if (document.getElementById(`saveProf_${stat}`).classList.contains('active')) {
                check(saveBoxMap[stat]);
            }
        });

        // 6. Skills
        const skillNames = [
            'Acrobatics', 'Animal', 'Arcana', 'Athletics', 'Deception', 'History',
            'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception',
            'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'
        ];
        skillsData.forEach((skill, i) => {
            fill(skillNames[i], document.getElementById(`skillVal_${i}`).innerText, 10);
            if (document.getElementById(`skillProf_${i}`).classList.contains('active')) {
                check(`Check Box ${23 + i}`);
            }
        });

        // 7. Combat
        fill('AC', document.getElementById('valAC').value, 18);
        fill('Initiative', document.getElementById('dispInit').innerText, 18);
        fill('Speed', document.getElementById('dispSpeed').innerText.replace(/[^0-9]/g, ''), 14);
        fill('HPMax', document.getElementById('hpMax').value, 12);
        fill('HPCurrent', document.getElementById('hpCurr').value, 12);
        fill('HDTotal', document.getElementById('totalLevelDisplay').innerText, 10);
        fill('HD', document.getElementById('hitDice').value, 10);
        fill('ProfBonus', document.getElementById('dispProf').innerText, 12);
        fill('Passive', document.getElementById('dispPassivePerc').innerText, 12);

        fill('GP', document.getElementById('currGP').value, 10);
        fill('SP', document.getElementById('currSP').value, 10);
        fill('CP', document.getElementById('currCP').value, 10);

        // 8. Bio & Lists
        fill('PersonalityTraits ', document.getElementById('bioPersonality').value, 10);
        fill('Ideals', document.getElementById('bioIdeals').value, 10);
        fill('Bonds', document.getElementById('bioBonds').value, 10);
        fill('Flaws', document.getElementById('bioFlaws').value, 10);

        fill('Backstory', document.getElementById('bioNotes').value, 10, true);
        fill('Allies', document.getElementById('bioAllies').value, 10, true);

        fill('Age', document.getElementById('bioAge').value, 10);
        fill('Height', document.getElementById('bioHeight').value, 10);
        fill('Weight', document.getElementById('bioWeight').value, 10);
        fill('Eyes', document.getElementById('bioEyes').value, 10);
        fill('Skin', document.getElementById('bioSkin').value, 10);
        fill('Hair', document.getElementById('bioHair').value, 10);

        let profText = "LANGUAGES:\n" + document.getElementById('bioLanguages').value + "\n\nTOOLS:\n" + tools.join(', ');
        fill('ProficienciesLang', profText, 9, true);

        // 9. Feat Splitter (Titles Only)
        let mainFeatText = "";
        let additionalFeatText = "";
        const MAX_MAIN_CHARS = 1800;

        for (let f of feats) {
            let entry = `- ${f.t}\n`;
            if ((mainFeatText.length + entry.length) < MAX_MAIN_CHARS) {
                mainFeatText += entry;
            } else {
                additionalFeatText += entry;
            }
        }

        fill('Features and Traits', mainFeatText, 9, true);
        fill('AdditionalFeatures', additionalFeatText, 10, true);
        fill('ADDITIONAL FEATURES & TRAITS', additionalFeatText, 10, true);

        let equipText = "";
        inventory.forEach(i => equipText += `- ${i.n} (x${i.q})\n`);
        fill('Equipment', equipText, 8, true);

        // 10. Attacks
        const attacks = document.querySelectorAll('.attack-row');
        for (let i = 0; i < 3; i++) {
            if (attacks[i]) {
                const name = attacks[i].querySelector('.atk-name').value;
                const bonus = attacks[i].querySelector('.atk-bonus').value;
                const dmg = attacks[i].querySelector('.atk-dmg').value;

                fill(i === 0 ? 'Wpn Name' : `Wpn Name ${i + 1}`, name, 10);
                fill(`Wpn${i + 1} AtkBonus`, bonus, 10);
                fill(`Wpn${i + 1} Damage`, dmg, 10);
            }
        }

        // 11. Spells
        fill('SpellcastingAbility 2', document.getElementById('spellAbility').value.toUpperCase(), 12);
        fill('SpellSaveDC 2', document.getElementById('spellDC').value, 12);
        fill('SpellAtkBonus 2', document.getElementById('spellAtk').value, 12);
        fill('Spellcasting Class 2', charClasses[0] ? charClasses[0].name : "", 12);

        for (let i = 1; i <= 9; i++) {
            fill(`SlotsTotal ${18 + i}`, document.getElementById(`slotMax_${i}`).value, 10);
        }

        const getSpellIDs = (lvl) => {
            const ids = [];
            if (lvl === 0) {
                ids.push(1014, 1016);
                for (let k = 1017; k <= 1022; k++) ids.push(k);
            } else if (lvl === 1) {
                ids.push(1015);
                for (let k = 1023; k <= 1033; k++) ids.push(k);
            } else if (lvl === 2) {
                ids.push(1046);
                for (let k = 1034; k <= 1045; k++) ids.push(k);
            } else if (lvl === 3) {
                ids.push(1048, 1047);
                for (let k = 1049; k <= 1059; k++) ids.push(k);
            } else if (lvl === 4) {
                ids.push(1061, 1060);
                for (let k = 1062; k <= 1072; k++) ids.push(k);
            } else {
                let prevLast = 1072;
                if (lvl > 5) {
                    const endPoints = { 5: 1081, 6: 1090, 7: 1099, 8: 1106 };
                    prevLast = endPoints[lvl - 1];
                }
                const first = prevLast + 2;
                ids.push(first, first - 1, first + 1);
                for (let k = 1; k <= 6; k++) ids.push(first + 1 + k);
            }
            return ids;
        };

        spells.sort((a, b) => a.lvl - b.lvl);
        const spellsByLevel = {};
        spells.forEach(s => {
            if (!spellsByLevel[s.lvl]) spellsByLevel[s.lvl] = [];
            spellsByLevel[s.lvl].push(s);
        });

        for (const [lvlStr, spellList] of Object.entries(spellsByLevel)) {
            const lvl = parseInt(lvlStr);
            const idList = getSpellIDs(lvl);

            spellList.forEach((s, index) => {
                if (index < idList.length) {
                    fill(`Spells ${idList[index]}`, s.n, 10);
                }
            });
        }

        // 12. Save PDF
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `exported_${document.getElementById('charName').value || 'char'}.pdf`;
        link.click();

        showPopup("PDF Exported Successfully!");
    } catch (err) {
        console.error(err);
        showPopup("Export Failed. See console for details.");
    }
    input.value = '';
}

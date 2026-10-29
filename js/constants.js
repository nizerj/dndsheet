// --- STATIC DATA & INITIAL DEFAULTS ---

const DEFAULT_AVATAR_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNWM0MDMzIiBzdHJva2Utd2lkdGg9IjEiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTEyIDhhNCA0IDAgMSAwIDAgOCA0IDQgMCAwIDAgMCAwLTh6Ii8+PHBhdGggZD0iTTE2IDE2YzAgMS41LTEuNSAzLTMgM3MtMy0xLjUtMy0zIi8+PC9zdmc+";

const STORAGE_KEY = 'titan_dnd5e_sheet';

const attributes = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];

const skillsData = [
    { n: 'Acrobatics', a: 'Dex' },
    { n: 'Animal Handling', a: 'Wis' },
    { n: 'Arcana', a: 'Int' },
    { n: 'Athletics', a: 'Str' },
    { n: 'Deception', a: 'Cha' },
    { n: 'History', a: 'Int' },
    { n: 'Insight', a: 'Wis' },
    { n: 'Intimidation', a: 'Cha' },
    { n: 'Investigation', a: 'Int' },
    { n: 'Medicine', a: 'Wis' },
    { n: 'Nature', a: 'Int' },
    { n: 'Perception', a: 'Wis' },
    { n: 'Performance', a: 'Cha' },
    { n: 'Persuasion', a: 'Cha' },
    { n: 'Religion', a: 'Int' },
    { n: 'Sleight of Hand', a: 'Dex' },
    { n: 'Stealth', a: 'Dex' },
    { n: 'Survival', a: 'Wis' }
];

const xpTable = [
    0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
    85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
];

function getInitialRaces() {
    return {
        "Dwarf": { str: 0, dex: 0, con: 2, int: 0, wis: 0, cha: 0, speed: "25" },
        "Elf": { str: 0, dex: 2, con: 0, int: 0, wis: 0, cha: 0, speed: "30" },
        "Halfling": { str: 0, dex: 2, con: 0, int: 0, wis: 0, cha: 0, speed: "25" },
        "Human": { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1, speed: "30" },
        "Dragonborn": { str: 2, dex: 0, con: 0, int: 0, wis: 0, cha: 1, speed: "30" },
        "Gnome": { str: 0, dex: 0, con: 0, int: 2, wis: 0, cha: 0, speed: "25" },
        "Half-Elf": { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 2, speed: "30" },
        "Half-Orc": { str: 2, dex: 0, con: 1, int: 0, wis: 0, cha: 0, speed: "30" },
        "Tiefling": { str: 0, dex: 0, con: 0, int: 1, wis: 0, cha: 2, speed: "30" }
    };
}

function getInitialClasses() {
    return {
        "Barbarian": { hd: "d12" },
        "Bard": { hd: "d8" },
        "Cleric": { hd: "d8" },
        "Druid": { hd: "d8" },
        "Fighter": { hd: "d10" },
        "Monk": { hd: "d8" },
        "Paladin": { hd: "d10" },
        "Ranger": { hd: "d10" },
        "Rogue": { hd: "d8" },
        "Sorcerer": { hd: "d6" },
        "Warlock": { hd: "d8" },
        "Wizard": { hd: "d6" }
    };
}

function getInitialItemCategories() {
    return ['Weapon', 'Armor', 'Gear', 'Magic Item', 'Consumable'];
}

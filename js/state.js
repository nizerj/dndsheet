// --- APPLICATION STATE ---

let useMetric = false;
let inspiration = false;
let currentSpellFilter = 'Prepared';

let editingItemIndex = null;
let editingSpellIndex = null;
let editingFeatIndex = null;

// Multiclass, Journal, and Stat Block Images
let charClasses = [];
let journal = [];
let statImages = [];

// Databases & Lists
let racesDB = getInitialRaces();
let classesDB = getInitialClasses();

let inventory = [];
let feats = [];
let spells = [];
let tools = [];
let itemCategories = getInitialItemCategories();

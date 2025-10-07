// TCG Sets Data
const TCG_SETS = {
    "Alpha_Venture": {
        name: "Alpha Venture",
        totalCards: 60,
        packSize: 12,
        boosterBoxSize: 30,
        packComposition: { common: 7, uncommon: 3, rare: 1 },
        mythicChance: 1 / 8,
        foilChance: 1 / 6,
        isWeekly: false,
        cards: {
            common: ["Goblin Grunt", "Forest Sprite", "River Drake", "Stone Golem", "Zealous Knight", "Shadow Stalker", "Arcane Apprentice", "Healing Salve", "Quick Strike", "Mountain Goat", "Swamp Rat", "Floating Eye", "Armored Guard", "Village Blacksmith", "Wandering Monk"],
            uncommon: ["Ogre Brute", "Elven Archer", "Kraken's Tentacle", "Gargoyle Sentry", "Captain of the Guard", "Vampire Initiate", "Fireball", "Counterspell", "Holy Light", "Rockslide", "Poison Cloud", "Mind Twist", "Reinforced Armor", "Masterwork Sword", "Amulet of Vigor"],
            rare: ["Hill Giant", "Greenwood Protector", "Sea Serpent", "Obsidian Golem", "Champion of the Realm", "Lich's Familiar", "Meteor Shower", "Time Warp", "Divine Intervention", "Earthquake", "Plague Wind", "Psychic Vortex", "Enchanted Plate", "Sword of the Ancients", "Ring of Wizardry"],
            mythic: ["Ancient Dragon", "World Tree", "Leviathan", "Titan of Chaos", "Archangel Avacyn", "Lord of the Undead", "Armageddon", "Force of Will"]
        }
    },
    "Chrono_Clash": {
        name: "Chrono Clash",
        totalCards: 75,
        packSize: 12,
        boosterBoxSize: 30,
        packComposition: { common: 7, uncommon: 3, rare: 1 },
        mythicChance: 1 / 7,
        foilChance: 1 / 5,
        isWeekly: false,
        cards: {
            common: ["Clockwork Beetle", "Time-Worn Cobblestone", "Future Sight Adept", "Past Echoes", "Temporal Rift", "Wasteland Scavenger", "Gear Soldier", "Rusted Bolt", "Fading Memory", "Sandstorm Nomad", "Dune Wanderer", "Scrap Heap", "Bronze Automaton", "Steam-Powered Scout", "Chronovore Mite"],
            uncommon: ["Time Warden", "Paradox Engine", "Aetherium Tinkerer", "Rewind Clock", "Temporal Anchor", "Future Shock Trooper", "Cogwork Librarian", "Steam Blast", "Accelerated Timeline", "Ancient Ruins Guardian", "Oasis Watcher", "Junk Golem", "Brass Commander", "Power Cell", "Vision of Tomorrow"],
            rare: ["Master of Moments", "Time Sieve", "The Grand Orrery", "Temporal Distortion", "Lord of the Cogwork", "Future Primeval", "Aeon Chronicler", "Blast from the Past", "Timeline Collapse", "Colossus of the Wastes", "Mirage Mirror", "Scrap Trawler", "Chief of the Foundry", "Energy Conduit", "Glimpse the Unthinkable"],
            mythic: ["The Time Traveler", "Infinity Engine", "Aeon Wave", "Paradox Haze Lord", "Forge of Futures", "Chronomancer Prime", "Nexus of Fate", "The Great Desert Sphinx"]
        }
    }
};

// Weekly Set Generator
class WeeklySetGenerator {
    constructor() {
        this.cardNameGenerators = {
            common: [
                "Ancient", "Brave", "Cunning", "Dark", "Elder", "Fierce", "Golden", "Hidden", "Iron", "Jade",
                "Knight", "Loyal", "Mystic", "Noble", "Ominous", "Proud", "Quick", "Royal", "Silent", "True",
                "Bold", "Calm", "Daring", "Eager", "Feral", "Gentle", "Hardy", "Ivory", "Jolly", "Keen",
                "Lucky", "Mighty", "Nimble", "Oddly", "Pure", "Quiet", "Rough", "Steady", "Trusty", "Vile"
            ],
            uncommon: [
                "Arcane", "Blazing", "Celestial", "Divine", "Ethereal", "Forbidden", "Glorious", "Haunted", "Infernal", "Jeweled",
                "Legendary", "Majestic", "Nightmare", "Obsidian", "Phantom", "Radiant", "Spectral", "Thunderous", "Umbral", "Vengeful",
                "Astral", "Burning", "Cursed", "Dreadful", "Enchanted", "Frozen", "Ghostly", "Hallowed", "Icy", "Jinxed",
                "Luminous", "Molten", "Noxious", "Opulent", "Poisoned", "Quaking", "Ruined", "Shadowy", "Twisted", "Volatile"
            ],
            rare: [
                "Apex", "Boundless", "Catastrophic", "Dominion", "Eternal", "Fractal", "Genesis", "Harbinger", "Infinite", "Juggernaut",
                "Kinetic", "Luminous", "Metamorphic", "Nexus", "Omnipotent", "Primordial", "Quantum", "Runic", "Sovereign", "Transcendent",
                "Abyssal", "Blistering", "Cataclysmic", "Devastating", "Epochal", "Formidable", "Gargantuan", "Hypnotic", "Immaculate", "Jagged",
                "Kaleidoscopic", "Legendary", "Monumental", "Nightmarish", "Overwhelming", "Paradoxical", "Quintessential", "Relentless", "Seismic", "Titanic"
            ],
            mythic: [
                "Absolute", "Boundless", "Cosmic", "Divine", "Endless", "Fundamental", "Godlike", "Heavenly", "Immortal", "Infinite",
                "Limitless", "Masterful", "Omniscient", "Perfect", "Quintessential", "Supreme", "Timeless", "Ultimate", "Void", "World-Breaking",
                "Apocalyptic", "Beyond", "Celestial", "Dimensional", "Everlasting", "Fathomless", "Galactic", "Hallowed", "Immeasurable", "Judgmental",
                "Kingdom", "Legendary", "Metaphysical", "Neverending", "Omnipresent", "Planetary", "Quantum", "Reality", "Supernatural", "Transcendental"
            ]
        };

        this.creatureTypes = [
            "Avatar", "Beast", "Demon", "Dragon", "Elemental", "Giant", "Golem", "Griffin", "Horror", "Knight",
            "Mage", "Phoenix", "Serpent", "Shade", "Spirit", "Titan", "Warrior", "Wizard", "Wraith", "Zombie",
            "Angel", "Barbarian", "Chimera", "Djinn", "Elf", "Faerie", "Gargoyle", "Hydra", "Imp", "Juggernaut",
            "Kraken", "Lich", "Minotaur", "Nymph", "Orc", "Pegasus", "Quetzal", "Revenant", "Sphinx", "Troll"
        ];

        this.spellTypes = [
            "Blast", "Bolt", "Charm", "Curse", "Force", "Fury", "Gaze", "Lance", "Nova", "Pact",
            "Rage", "Rift", "Shield", "Storm", "Strike", "Surge", "Veil", "Ward", "Wave", "Wind",
            "Aura", "Bane", "Call", "Doom", "Echo", "Flux", "Gift", "Hex", "Infusion", "Jinx",
            "Kiss", "Lure", "Mark", "Orb", "Pulse", "Quell", "Rush", "Spell", "Touch", "Whisper"
        ];

        this.artifactTypes = [
            "Amulet", "Armor", "Blade", "Crown", "Gauntlet", "Helm", "Orb", "Ring", "Rod", "Scepter",
            "Shield", "Staff", "Sword", "Tome", "Wand", "Bow", "Dagger", "Hammer", "Mace", "Spear",
            "Axe", "Bracelet", "Cloak", "Diadem", "Earring", "Flute", "Girdle", "Horn", "Idol", "Jewel",
            "Key", "Lantern", "Mirror", "Necklace", "Opal", "Pendant", "Quiver", "Relic", "Stone", "Talisman"
        ];

        this.themes = [
            { name: "Elemental Fury", focus: "fire_water_earth_air" },
            { name: "Shadow Realm", focus: "darkness_death_undead" },
            { name: "Divine Light", focus: "angels_healing_protection" },
            { name: "Wild Hunt", focus: "beasts_nature_growth" },
            { name: "Arcane Mysteries", focus: "magic_knowledge_illusion" },
            { name: "Mechanical Marvel", focus: "artifacts_constructs_technology" },
            { name: "Warrior's Code", focus: "combat_honor_strength" },
            { name: "Temporal Nexus", focus: "time_space_dimension" }
        ];
    }

    getWeekNumber(date = new Date()) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        return Math.floor(diff / oneWeek);
    }

    getWeeklySetId(weekOffset = 0) {
        const now = new Date();
        const targetWeek = this.getWeekNumber(now) + weekOffset;
        const year = now.getFullYear();
        return `Weekly_${year}_W${targetWeek}`;
    }

    getWeeklySetDates() {
        const now = new Date();
        
        // Get the start of the current week (Monday)
        const dayOfWeek = now.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so adjust
        
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - daysFromMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setHours(0, 0, 0, 0);
        
        return { startOfWeek, endOfWeek };
    }

    seededRandom(seed) {
        // Simple seeded random number generator
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    generateCardName(rarity, seed, index) {
        const rarityAdjectives = this.cardNameGenerators[rarity];
        const adjIndex = Math.floor(this.seededRandom(seed + index) * rarityAdjectives.length);
        const adjective = rarityAdjectives[adjIndex];

        const typeRoll = this.seededRandom(seed + index + 1000);
        let noun;
        
        if (typeRoll < 0.4) {
            // Creature
            const nounIndex = Math.floor(this.seededRandom(seed + index + 2000) * this.creatureTypes.length);
            noun = this.creatureTypes[nounIndex];
        } else if (typeRoll < 0.7) {
            // Spell
            const nounIndex = Math.floor(this.seededRandom(seed + index + 3000) * this.spellTypes.length);
            noun = this.spellTypes[nounIndex];
        } else {
            // Artifact
            const nounIndex = Math.floor(this.seededRandom(seed + index + 4000) * this.artifactTypes.length);
            noun = this.artifactTypes[nounIndex];
        }

        return `${adjective} ${noun}`;
    }

    generateWeeklySet(weekOffset = 0) {
        const setId = this.getWeeklySetId(weekOffset);
        const now = new Date();
        const targetWeek = this.getWeekNumber(now) + weekOffset;
        const year = now.getFullYear();
        const seed = year * 1000 + targetWeek;

        // Choose theme for this week
        const themeIndex = Math.floor(this.seededRandom(seed) * this.themes.length);
        const theme = this.themes[themeIndex];

        // Generate cards for each rarity
        const cards = {
            common: [],
            uncommon: [],
            rare: [],
            mythic: []
        };

        // Generate different amounts for each rarity
        const cardCounts = { common: 50, uncommon: 40, rare: 28, mythic: 10 };

        for (const rarity in cardCounts) {
            for (let i = 0; i < cardCounts[rarity]; i++) {
                const cardName = this.generateCardName(rarity, seed, i);
                cards[rarity].push(cardName);
            }
        }

        const { startOfWeek, endOfWeek } = this.getWeeklySetDates();

        return {
            name: `${theme.name} (#${targetWeek})`,
            totalCards: Object.values(cardCounts).reduce((a, b) => a + b, 0),
            packSize: 12,
            boosterBoxSize: 26, // Slightly smaller for weekly sets
            packComposition: { common: 7, uncommon: 3, rare: 2 },
            mythicChance: 1 / 6, // Better mythic rate for weekly sets
            foilChance: 1 / 4, // Better foil rate for weekly sets
            isWeekly: true,
            theme: theme.name,
            weekNumber: targetWeek,
            year: year,
            startDate: startOfWeek,
            endDate: endOfWeek,
            cards: cards
        };
    }

    getCurrentWeeklySet() {
        return this.generateWeeklySet(0);
    }

    getNextWeeklySet() {
        return this.generateWeeklySet(1);
    }

    isWeeklySetActive() {
        const now = new Date();
        const { startOfWeek, endOfWeek } = this.getWeeklySetDates();
        return now >= startOfWeek && now <= endOfWeek;
    }

    getTimeUntilNextWeek() {
        const now = new Date();
        const { startOfWeek, endOfWeek } = this.getWeeklySetDates();
        
        // Add some debugging info in console during development
        if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
            console.log('Weekly Set Debug:', {
                now: now.toISOString(),
                startOfWeek: startOfWeek.toISOString(),
                endOfWeek: endOfWeek.toISOString(),
                timeUntilNext: endOfWeek.getTime() - now.getTime()
            });
        }
        
        return endOfWeek.getTime() - now.getTime();
    }

    // TESTING AND REGENERATION METHODS

    /**
     * Regenerates an existing weekly set with new random cards while preserving lifecycle data
     * @param {string} setId - The ID of the set to regenerate 
     * @param {number} newSeed - Optional custom seed for different randomization
     * @returns {Object} The regenerated set data
     */
    regenerateWeeklySet(setId, newSeed = null) {
        // Load existing set data to preserve lifecycle information
        const storageManager = window.storageManager || new StorageManager();
        const storedSets = storageManager.loadWeeklySets();
        const existingSet = storedSets[setId];
        
        if (!existingSet || !existingSet.isWeekly) {
            console.error(`Cannot regenerate set ${setId}: set not found or not a weekly set`);
            return null;
        }

        // Extract week and year from setId (format: Weekly_YYYY_WWW)
        const match = setId.match(/Weekly_(\d+)_W(\d+)/);
        if (!match) {
            console.error(`Invalid weekly set ID format: ${setId}`);
            return null;
        }

        const year = parseInt(match[1]);
        const week = parseInt(match[2]);
        const seed = newSeed || (year * 1000 + week + Math.floor(Math.random() * 1000)); // Add randomness if no custom seed

        // Choose theme for this regeneration
        const themeIndex = Math.floor(this.seededRandom(seed) * this.themes.length);
        const theme = this.themes[themeIndex];

        // Generate new cards for each rarity
        const cards = {
            common: [],
            uncommon: [],
            rare: [],
            mythic: []
        };

        const cardCounts = { common: 50, uncommon: 40, rare: 28, mythic: 10 };

        for (const rarity in cardCounts) {
            for (let i = 0; i < cardCounts[rarity]; i++) {
                const cardName = this.generateCardName(rarity, seed, i);
                cards[rarity].push(cardName);
            }
        }

        // Create regenerated set data, preserving original lifecycle data
        const regeneratedSet = {
            ...existingSet,
            name: `${theme.name} (#${week})`,
            theme: theme.name,
            cards: cards,
            regenerated: true,
            regeneratedDate: Date.now(),
            originalSeed: existingSet.seed || (year * 1000 + week),
            newSeed: seed
        };

        // Save the regenerated set
        storageManager.saveWeeklySet(setId, regeneratedSet);
        console.log(`Regenerated weekly set ${setId} with new theme: ${theme.name}`);
        
        return regeneratedSet;
    }

    /**
     * Generates a test weekly set without affecting storage or game state
     * @param {number} weekOffset - Offset from current week (0 = current, 1 = next, -1 = previous)
     * @param {number} customSeed - Optional custom seed for specific randomization
     * @param {string} customTheme - Optional specific theme name to use
     * @returns {Object} The test set data with preview information
     */
    testGenerateWeeklySet(weekOffset = 0, customSeed = null, customTheme = null) {
        const now = new Date();
        const targetWeek = this.getWeekNumber(now) + weekOffset;
        const year = now.getFullYear();
        const testSetId = `Weekly_${year}_W${targetWeek}_TEST_${Date.now()}`;
        
        const baseSeed = year * 1000 + targetWeek;
        const seed = customSeed || baseSeed;

        // Choose theme
        let theme;
        if (customTheme) {
            theme = this.themes.find(t => t.name === customTheme);
            if (!theme) {
                console.warn(`Theme "${customTheme}" not found, using random theme`);
                theme = this.themes[Math.floor(this.seededRandom(seed) * this.themes.length)];
            }
        } else {
            const themeIndex = Math.floor(this.seededRandom(seed) * this.themes.length);
            theme = this.themes[themeIndex];
        }

        // Generate cards for each rarity
        const cards = {
            common: [],
            uncommon: [],
            rare: [],
            mythic: []
        };

        const cardCounts = { common: 50, uncommon: 40, rare: 28, mythic: 10 };

        for (const rarity in cardCounts) {
            for (let i = 0; i < cardCounts[rarity]; i++) {
                const cardName = this.generateCardName(rarity, seed, i);
                cards[rarity].push(cardName);
            }
        }

        const { startOfWeek, endOfWeek } = this.getWeeklySetDates();

        const testSet = {
            name: `${theme.name} (#${targetWeek}) [TEST PREVIEW]`,
            totalCards: Object.values(cardCounts).reduce((a, b) => a + b, 0),
            packSize: 12,
            boosterBoxSize: 26,
            packComposition: { common: 7, uncommon: 3, rare: 2 },
            mythicChance: 1 / 6,
            foilChance: 1 / 4,
            isWeekly: true,
            isTestSet: true,
            theme: theme.name,
            weekNumber: targetWeek,
            year: year,
            seed: seed,
            lifecycle: 'preview',
            startDate: startOfWeek,
            endDate: endOfWeek,
            cards: cards,
            testInfo: {
                generated: new Date().toISOString(),
                weekOffset: weekOffset,
                customSeed: customSeed,
                customTheme: customTheme,
                actualSetId: `Weekly_${year}_W${targetWeek}`,
                previewId: testSetId
            }
        };

        console.log(`Generated test set preview:`, {
            id: testSetId,
            theme: theme.name,
            week: targetWeek,
            cardCounts: cardCounts,
            seed: seed
        });

        return testSet;
    }

    /**
     * Get available themes for testing
     * @returns {Array} List of available theme names
     */
    getAvailableThemes() {
        return this.themes.map(theme => theme.name);
    }
}

// Create global instance
const weeklySetGenerator = new WeeklySetGenerator();

// Enhanced function to get all available sets (including all stored weekly sets)
function getAllSets() {
    const allSets = { ...TCG_SETS };
    
    // Get storage manager instance
    const storageManager = window.storageManager || new StorageManager();
    
    // Load all stored weekly sets first
    const storedWeeklySets = storageManager.loadWeeklySets();
    
    // Get current weekly set info
    const currentWeeklyId = weeklySetGenerator.getWeeklySetId();
    
    // Check if current weekly set needs to be created and stored
    if (!storedWeeklySets[currentWeeklyId]) {
        // Generate and store the new weekly set
        const currentWeeklySet = weeklySetGenerator.getCurrentWeeklySet();
        storageManager.saveWeeklySet(currentWeeklyId, currentWeeklySet);
        
        // Reload stored sets to get the updated data
        const updatedStoredSets = storageManager.loadWeeklySets();
        Object.keys(updatedStoredSets).forEach(setId => {
            const setData = updatedStoredSets[setId];
            const updatedSetData = updateSetLifecycle(setData, storageManager, setId);
            allSets[setId] = updatedSetData;
        });
    } else {
        // Add all stored weekly sets with updated lifecycle status
        Object.keys(storedWeeklySets).forEach(setId => {
            const setData = storedWeeklySets[setId];
            const updatedSetData = updateSetLifecycle(setData, storageManager, setId);
            allSets[setId] = updatedSetData;
        });
    }
    
    return allSets;
}

// Helper function to update set lifecycle status
function updateSetLifecycle(setData, storageManager, setId) {
    const now = Date.now();
    let currentLifecycle = setData.lifecycle;
    
    // Get the current week's set ID to determine if this should be featured
    const currentWeeklyId = weeklySetGenerator.getWeeklySetId();
    
    // Only the current week's set should be featured
    if (setId === currentWeeklyId) {
        // Current week's set should always be featured
        if (currentLifecycle !== 'featured') {
            currentLifecycle = 'featured';
            storageManager.updateSetLifecycle(setId, 'featured');
        }
    } else {
        // All other weekly sets should not be featured
        if (currentLifecycle === 'featured') {
            currentLifecycle = 'standard';
            storageManager.updateSetLifecycle(setId, 'standard');
        }
        
        // Check if it should transition to legacy (after 30 days)
        if (now > setData.rotateDate && currentLifecycle !== 'legacy') {
            currentLifecycle = 'legacy';
            storageManager.updateSetLifecycle(setId, 'legacy');
        }
    }
    
    // Return set data with updated lifecycle and pricing modifiers
    return {
        ...setData,
        lifecycle: currentLifecycle,
        // Adjust pricing based on lifecycle
        packPriceMultiplier: getLifecyclePriceMultiplier(currentLifecycle),
        // Adjust pack composition for legacy sets
        ...(currentLifecycle === 'legacy' && {
            mythicChance: setData.mythicChance * 0.8, // Reduced mythic chance
            foilChance: setData.foilChance * 0.9, // Slightly reduced foil chance
        })
    };
}

// Helper function to get price multipliers for different lifecycle stages
function getLifecyclePriceMultiplier(lifecycle) {
    switch (lifecycle) {
        case 'featured': return 1.0; // Full weekly price
        case 'standard': return 0.8; // 20% discount from weekly price
        case 'legacy': return 0.6; // 40% discount from weekly price
        default: return 1.0;
    }
}

// TESTING AND DEVELOPMENT HELPER FUNCTIONS
// These functions are available in the browser console for testing

/**
 * Console helper: Test generate a weekly set without affecting game state
 * Usage: testWeeklySet() or testWeeklySet(1, 12345, "Elemental Fury")
 */
function testWeeklySet(weekOffset = 0, customSeed = null, customTheme = null) {
    const result = weeklySetGenerator.testGenerateWeeklySet(weekOffset, customSeed, customTheme);
    console.log('Test Set Generated:', result);
    console.log('Sample Cards by Rarity:');
    Object.keys(result.cards).forEach(rarity => {
        console.log(`${rarity.toUpperCase()}: ${result.cards[rarity].slice(0, 5).join(', ')}...`);
    });
    return result;
}

/**
 * Console helper: Regenerate an existing weekly set
 * Usage: regenerateSet("Weekly_2025_W40") or regenerateSet("Weekly_2025_W40", 99999)
 */
function regenerateSet(setId, newSeed = null) {
    const result = weeklySetGenerator.regenerateWeeklySet(setId, newSeed);
    if (result) {
        console.log('Set Regenerated:', result);
        console.log('New Sample Cards:');
        Object.keys(result.cards).forEach(rarity => {
            console.log(`${rarity.toUpperCase()}: ${result.cards[rarity].slice(0, 3).join(', ')}...`);
        });
        
        // Refresh the UI if game engine exists
        if (window.gameEngine && window.uiManager) {
            window.uiManager.populateSetSelectors();
            window.uiManager.renderCollection();
        }
    }
    return result;
}

/**
 * Console helper: List all available weekly sets
 */
function listWeeklySets() {
    const storageManager = window.storageManager || new StorageManager();
    const weeklySets = storageManager.loadWeeklySets();
    
    console.log('All Weekly Sets:');
    Object.keys(weeklySets).forEach(setId => {
        const set = weeklySets[setId];
        console.log(`${setId}: ${set.name} (${set.lifecycle}) - ${set.theme}`);
    });
    
    return weeklySets;
}

/**
 * Console helper: List all available themes
 */
function listThemes() {
    const themes = weeklySetGenerator.getAvailableThemes();
    console.log('Available Themes:', themes);
    return themes;
}

/**
 * Console helper: Get current week info
 */
function getCurrentWeekInfo() {
    const info = {
        currentWeekId: weeklySetGenerator.getWeeklySetId(),
        weekNumber: weeklySetGenerator.getWeekNumber(),
        timeUntilNext: weeklySetGenerator.getTimeUntilNextWeek(),
        daysUntilNext: Math.ceil(weeklySetGenerator.getTimeUntilNextWeek() / (1000 * 60 * 60 * 24))
    };
    console.log('Current Week Info:', info);
    return info;
}

/**
 * Console helper: Preview next week's set
 */
function previewNextWeek() {
    return testWeeklySet(1);
}

/**
 * Console helper: Show help for testing functions
 */
function helpWeeklySetTesting() {
    console.log(`
Weekly Set Testing Commands:
----------------------------
testWeeklySet(weekOffset?, seed?, theme?)  - Generate test set without saving
  Examples:
    testWeeklySet()                         - Test current week
    testWeeklySet(1)                        - Test next week
    testWeeklySet(0, 12345)                 - Test with custom seed
    testWeeklySet(0, null, "Elemental Fury") - Test with specific theme

regenerateSet(setId, newSeed?)              - Regenerate existing set
  Examples:
    regenerateSet("Weekly_2025_W40")        - Regenerate with random new cards
    regenerateSet("Weekly_2025_W40", 99999) - Regenerate with specific seed

listWeeklySets()                            - Show all stored weekly sets
listThemes()                                - Show all available themes
getCurrentWeekInfo()                        - Show current week information
previewNextWeek()                           - Preview next week's set
helpWeeklySetTesting()                      - Show this help

Note: Use regenerateSet() to change existing sets, testWeeklySet() for previews only.
    `);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        TCG_SETS, 
        WeeklySetGenerator, 
        weeklySetGenerator, 
        getAllSets,
        testWeeklySet,
        regenerateSet,
        listWeeklySets,
        listThemes,
        getCurrentWeekInfo,
        previewNextWeek,
        helpWeeklySetTesting
    };
} else {
    // Make everything available globally
    window.TCG_SETS = TCG_SETS;
    window.WeeklySetGenerator = WeeklySetGenerator;
    window.weeklySetGenerator = weeklySetGenerator;
    window.getAllSets = getAllSets;
    
    // Testing helper functions
    window.testWeeklySet = testWeeklySet;
    window.regenerateSet = regenerateSet;
    window.listWeeklySets = listWeeklySets;
    window.listThemes = listThemes;
    window.getCurrentWeekInfo = getCurrentWeekInfo;
    window.previewNextWeek = previewNextWeek;
    window.helpWeeklySetTesting = helpWeeklySetTesting;
}
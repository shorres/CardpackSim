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

        // Theme-specific word pools for more thematic card names
        this.themeWordPools = {
            "Elemental Fury": {
                adjectives: ["Blazing", "Molten", "Frozen", "Stormy", "Volcanic", "Glacial", "Lightning", "Tempest", "Scorching", "Crystalline"],
                creatures: ["Phoenix", "Dragon", "Elemental", "Salamander", "Frost Giant", "Storm Spirit", "Magma Beast", "Ice Wraith", "Thunder Bird", "Flame Sprite"],
                spells: ["Inferno", "Blizzard", "Hurricane", "Eruption", "Avalanche", "Tornado", "Firestorm", "Frostbolt", "Lightning", "Meteor"],
                artifacts: ["Ember", "Crystal", "Prism", "Furnace", "Glacier", "Conduit", "Core", "Shard", "Vortex", "Nexus"]
            },
            "Shadow Realm": {
                adjectives: ["Dark", "Cursed", "Haunted", "Spectral", "Malevolent", "Sinister", "Wrathful", "Dreadful", "Ominous", "Nightmarish"],
                creatures: ["Wraith", "Shade", "Banshee", "Lich", "Revenant", "Shadow", "Demon", "Specter", "Ghoul", "Necromancer"],
                spells: ["Curse", "Hex", "Blight", "Drain", "Doom", "Decay", "Plague", "Wither", "Terror", "Soul Burn"],
                artifacts: ["Grimoire", "Skull", "Bone", "Phylactery", "Chalice", "Crypt", "Tome", "Coffin", "Scythe", "Crown"]
            },
            "Divine Light": {
                adjectives: ["Holy", "Sacred", "Blessed", "Divine", "Radiant", "Celestial", "Pure", "Sanctified", "Hallowed", "Luminous"],
                creatures: ["Angel", "Seraph", "Paladin", "Priest", "Guardian", "Herald", "Saint", "Crusader", "Champion", "Avatar"],
                spells: ["Blessing", "Heal", "Purify", "Sanctuary", "Ward", "Grace", "Prayer", "Miracle", "Light", "Salvation"],
                artifacts: ["Halo", "Wings", "Chalice", "Cross", "Shrine", "Altar", "Relic", "Scripture", "Mace", "Shield"]
            },
            "Wild Hunt": {
                adjectives: ["Primal", "Savage", "Feral", "Wild", "Untamed", "Bestial", "Primitive", "Tribal", "Ancient", "Natural"],
                creatures: ["Wolf", "Bear", "Eagle", "Stag", "Panther", "Hawk", "Boar", "Tiger", "Elk", "Lynx"],
                spells: ["Hunt", "Track", "Pounce", "Howl", "Roar", "Charge", "Stalk", "Ambush", "Pack", "Territory"],
                artifacts: ["Claw", "Fang", "Hide", "Antler", "Feather", "Tusk", "Pelt", "Bone", "Totem", "Trophy"]
            },
            "Arcane Mysteries": {
                adjectives: ["Arcane", "Mystic", "Enigmatic", "Esoteric", "Cryptic", "Ancient", "Forbidden", "Hidden", "Secret", "Profound"],
                creatures: ["Wizard", "Sage", "Oracle", "Seer", "Magus", "Scholar", "Artificer", "Mystic", "Adept", "Diviner"],
                spells: ["Divination", "Enchantment", "Illusion", "Transmutation", "Conjuration", "Evocation", "Scrying", "Ritual", "Incantation", "Invocation"],
                artifacts: ["Tome", "Scroll", "Wand", "Staff", "Orb", "Crystal", "Rune", "Codex", "Tablet", "Lens"]
            },
            "Mechanical Marvel": {
                adjectives: ["Mechanical", "Clockwork", "Steam", "Gear", "Bronze", "Steel", "Automated", "Powered", "Engineered", "Constructed"],
                creatures: ["Golem", "Automaton", "Construct", "Machine", "Engine", "Drone", "Mech", "Robot", "Gear", "Clockwork"],
                spells: ["Repair", "Upgrade", "Power", "Malfunction", "Override", "Activate", "Calibrate", "Engineer", "Assembly", "Process"],
                artifacts: ["Gear", "Engine", "Boiler", "Piston", "Turbine", "Dynamo", "Coil", "Spring", "Valve", "Module"]
            },
            "Warrior's Code": {
                adjectives: ["Valiant", "Honor", "Mighty", "Noble", "Fierce", "Stalwart", "Brave", "Heroic", "Veteran", "Elite"],
                creatures: ["Knight", "Warrior", "Soldier", "Champion", "Gladiator", "Commander", "Captain", "Berserker", "Guardian", "Sentinel"],
                spells: ["Strike", "Charge", "Rally", "Challenge", "Duel", "March", "Formation", "Tactics", "Victory", "Honor"],
                artifacts: ["Sword", "Shield", "Armor", "Banner", "Helm", "Gauntlet", "Blade", "Spear", "Axe", "Mace"]
            },
            "Temporal Nexus": {
                adjectives: ["Temporal", "Timeless", "Chronos", "Eternal", "Ancient", "Future", "Past", "Timeworn", "Epochal", "Infinite"],
                creatures: ["Timekeeper", "Chronarch", "Time Lord", "Temporal", "Epoch", "Paradox", "Continuum", "Dimension", "Aeon", "Chrono"],
                spells: ["Rewind", "Accelerate", "Pause", "Shift", "Loop", "Distort", "Echo", "Ripple", "Flux", "Convergence"],
                artifacts: ["Clock", "Hourglass", "Chronometer", "Sundial", "Metronome", "Pendulum", "Timepiece", "Gear", "Spring", "Dial"]
            }
        };

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
        // More reliable week calculation using ISO week date
        const start = new Date(date.getFullYear(), 0, 1);
        const diff = date - start;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        const weekNumber = Math.floor(diff / oneWeek) + 1; // Add 1 to start from week 1
        return weekNumber;
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

    /**
     * Get recently used themes from stored weekly sets
     * @param {number} lookBackWeeks - How many weeks to look back
     * @returns {Array} Array of recently used theme names
     */
    getRecentThemes(lookBackWeeks = 4) {
        const storageManager = window.storageManager || new StorageManager();
        const storedSets = storageManager.loadWeeklySets();
        const recentThemes = [];
        
        const now = new Date();
        const currentWeek = this.getWeekNumber(now);
        const currentYear = now.getFullYear();
        
        // Check the last N weeks for used themes
        for (let i = 1; i <= lookBackWeeks; i++) {
            const checkWeek = currentWeek - i;
            const setId = `Weekly_${currentYear}_W${checkWeek}`;
            
            if (storedSets[setId] && storedSets[setId].theme) {
                recentThemes.push(storedSets[setId].theme);
            }
        }
        
        return recentThemes;
    }

    /**
     * Get card names from a specific week's set
     * @param {number} weekOffset - Offset from current week (negative for past weeks)
     * @returns {Array} Array of all card names from that week
     */
    getWeekCardNames(weekOffset) {
        const storageManager = window.storageManager || new StorageManager();
        const storedSets = storageManager.loadWeeklySets();
        
        const now = new Date();
        const targetWeek = this.getWeekNumber(now) + weekOffset;
        const year = now.getFullYear();
        const setId = `Weekly_${year}_W${targetWeek}`;
        
        if (storedSets[setId] && storedSets[setId].cards) {
            const allCards = [];
            Object.values(storedSets[setId].cards).forEach(rarityCards => {
                allCards.push(...rarityCards);
            });
            return allCards;
        }
        
        return [];
    }

    /**
     * Select a unique theme that hasn't been used recently
     * @param {number} seed - Base seed for randomization
     * @param {number} targetWeek - Target week number
     * @param {number} year - Target year
     * @param {Array} excludeThemes - Theme names to exclude
     * @returns {Object} Selected theme object
     */
    selectUniqueTheme(seed, targetWeek, year, excludeThemes = []) {
        // Get recently used themes if not provided
        if (excludeThemes.length === 0) {
            excludeThemes = this.getRecentThemes(4); // Look back 4 weeks by default
        }
        
        // Filter available themes
        const availableThemes = this.themes.filter(theme => 
            !excludeThemes.includes(theme.name)
        );
        
        // If all themes are excluded (very rare), use all themes
        const themePool = availableThemes.length > 0 ? availableThemes : this.themes;
        
        // Use improved selection logic on the filtered pool
        const themeBase = (targetWeek * 7 + year * 3) % themePool.length;
        const themeSeedOffset = Math.floor(this.seededRandom(seed + 999) * Math.min(3, themePool.length));
        const themeIndex = (themeBase + themeSeedOffset) % themePool.length;
        
        return themePool[themeIndex];
    }

    /**
     * Generate unique card names that don't conflict with recent weeks
     * @param {string} rarity - Card rarity
     * @param {number} seed - Base seed
     * @param {number} index - Card index
     * @param {Array} excludeNames - Card names to avoid
     * @param {string} theme - Theme name for thematic card generation
     * @returns {string} Generated card name
     */
    generateUniqueCardName(rarity, seed, index, excludeNames = [], theme = null) {
        let attempts = 0;
        let cardName;
        
        do {
            const modifiedSeed = seed + index + (attempts * 1000);
            cardName = this.generateCardName(rarity, modifiedSeed, index, theme);
            attempts++;
        } while (excludeNames.includes(cardName) && attempts < 100);
        
        return cardName;
    }

    generateCardName(rarity, seed, index, theme = null) {
        // 60% chance to use theme-specific words if theme is provided
        const useThematic = theme && this.themeWordPools[theme] && this.seededRandom(seed + index + 5000) < 0.6;
        
        let adjective, noun;
        
        if (useThematic) {
            // Use theme-specific adjectives with 70% chance, fallback to rarity adjectives
            const themePool = this.themeWordPools[theme];
            const useThemeAdj = this.seededRandom(seed + index + 6000) < 0.7;
            
            if (useThemeAdj && themePool.adjectives.length > 0) {
                const adjIndex = Math.floor(this.seededRandom(seed + index + 7000) * themePool.adjectives.length);
                adjective = themePool.adjectives[adjIndex];
            } else {
                const rarityAdjectives = this.cardNameGenerators[rarity];
                const adjIndex = Math.floor(this.seededRandom(seed + index) * rarityAdjectives.length);
                adjective = rarityAdjectives[adjIndex];
            }
            
            // Determine type and use theme-specific nouns
            const typeRoll = this.seededRandom(seed + index + 1000);
            
            if (typeRoll < 0.4 && themePool.creatures.length > 0) {
                // Creature - use theme creatures
                const nounIndex = Math.floor(this.seededRandom(seed + index + 2000) * themePool.creatures.length);
                noun = themePool.creatures[nounIndex];
            } else if (typeRoll < 0.7 && themePool.spells.length > 0) {
                // Spell - use theme spells
                const nounIndex = Math.floor(this.seededRandom(seed + index + 3000) * themePool.spells.length);
                noun = themePool.spells[nounIndex];
            } else if (themePool.artifacts.length > 0) {
                // Artifact - use theme artifacts
                const nounIndex = Math.floor(this.seededRandom(seed + index + 4000) * themePool.artifacts.length);
                noun = themePool.artifacts[nounIndex];
            } else {
                // Fallback to generic types if theme pool is empty
                const fallbackTypeRoll = this.seededRandom(seed + index + 1000);
                if (fallbackTypeRoll < 0.4) {
                    const nounIndex = Math.floor(this.seededRandom(seed + index + 2000) * this.creatureTypes.length);
                    noun = this.creatureTypes[nounIndex];
                } else if (fallbackTypeRoll < 0.7) {
                    const nounIndex = Math.floor(this.seededRandom(seed + index + 3000) * this.spellTypes.length);
                    noun = this.spellTypes[nounIndex];
                } else {
                    const nounIndex = Math.floor(this.seededRandom(seed + index + 4000) * this.artifactTypes.length);
                    noun = this.artifactTypes[nounIndex];
                }
            }
        } else {
            // Use original generic generation
            const rarityAdjectives = this.cardNameGenerators[rarity];
            const adjIndex = Math.floor(this.seededRandom(seed + index) * rarityAdjectives.length);
            adjective = rarityAdjectives[adjIndex];

            const typeRoll = this.seededRandom(seed + index + 1000);
            
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
        }

        return `${adjective} ${noun}`;
    }

    generateWeeklySet(weekOffset = 0) {
        const setId = this.getWeeklySetId(weekOffset);
        const now = new Date();
        const targetWeek = this.getWeekNumber(now) + weekOffset;
        const year = now.getFullYear();
        const seed = year * 1000 + targetWeek;

        // Use unique theme selection to avoid repeats
        const theme = this.selectUniqueTheme(seed, targetWeek, year);

        // Get card names from recent weeks to avoid duplicates
        const recentCardNames = [];
        for (let i = 1; i <= 2; i++) { // Check previous 2 weeks
            const recentCards = this.getWeekCardNames(-i);
            recentCardNames.push(...recentCards);
        }

        // Generate cards for each rarity
        const cards = {
            common: [],
            uncommon: [],
            rare: [],
            mythic: []
        };

        // Generate different amounts for each rarity
        const cardCounts = { common: 25, uncommon: 20, rare: 18, mythic: 6 };

        for (const rarity in cardCounts) {
            for (let i = 0; i < cardCounts[rarity]; i++) {
                const cardName = this.generateUniqueCardName(rarity, seed, i, recentCardNames, theme.name);
                cards[rarity].push(cardName);
                // Add to exclusion list to prevent duplicates within the same set
                recentCardNames.push(cardName);
            }
        }

        const { startOfWeek, endOfWeek } = this.getWeeklySetDates();

        return {
            name: `${theme.name} (#${targetWeek})`,
            totalCards: Object.values(cardCounts).reduce((a, b) => a + b, 0),
            packSize: 12,
            boosterBoxSize: 26, // Slightly smaller for weekly sets
            packComposition: { common: 6, uncommon: 5, rare: 3 },
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

        // Use unique theme selection for regeneration
        const theme = this.selectUniqueTheme(seed, week, year);

        // Get card names from recent weeks to avoid duplicates (for regeneration)
        const recentCardNames = [];
        for (let i = 1; i <= 2; i++) { // Check weeks before and after
            const beforeCards = this.getWeekCardNames(-i);
            const afterCards = this.getWeekCardNames(i);
            recentCardNames.push(...beforeCards, ...afterCards);
        }

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
                const cardName = this.generateUniqueCardName(rarity, seed, i, recentCardNames, theme.name);
                cards[rarity].push(cardName);
                // Add to exclusion list to prevent duplicates within the same set
                recentCardNames.push(cardName);
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
        // Fix: Always use a different seed for test sets unless specifically provided
        const seed = customSeed !== null ? customSeed : (baseSeed + 77777 + Math.floor(Math.random() * 10000));

        // Choose theme
        let theme;
        if (customTheme) {
            theme = this.themes.find(t => t.name === customTheme);
            if (!theme) {
                console.warn(`Theme "${customTheme}" not found, using unique theme selection`);
                theme = this.selectUniqueTheme(seed, targetWeek, year);
            }
        } else {
            // Use unique theme selection for test sets too
            theme = this.selectUniqueTheme(seed, targetWeek, year);
        }

        // Get card names from recent weeks for test uniqueness
        const recentCardNames = [];
        for (let i = 1; i <= 2; i++) {
            const recentCards = this.getWeekCardNames(-i);
            recentCardNames.push(...recentCards);
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
                const cardName = this.generateUniqueCardName(rarity, seed, i, recentCardNames, theme.name);
                cards[rarity].push(cardName);
                // Add to exclusion list to prevent duplicates within the same set
                recentCardNames.push(cardName);
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
                previewId: testSetId,
                actualSeed: baseSeed,
                testSeed: seed
            }
        };

        console.log(`Generated test set preview:`, {
            id: testSetId,
            theme: theme.name,
            week: targetWeek,
            cardCounts: cardCounts,
            seed: seed,
            actualSeed: baseSeed,
            weekOffset: weekOffset
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
    
    // Show comparison with actual stored set if it exists
    const actualSetId = result.testInfo.actualSetId;
    const storageManager = window.storageManager || new StorageManager();
    const storedSets = storageManager.loadWeeklySets();
    
    if (storedSets[actualSetId]) {
        const actualSet = storedSets[actualSetId];
        console.log(`\nComparison with actual stored set "${actualSetId}":`);
        console.log(`Actual Theme: ${actualSet.theme} | Test Theme: ${result.theme}`);
        console.log(`Actual Seed: ${result.testInfo.actualSeed} | Test Seed: ${result.testInfo.testSeed}`);
        console.log('First 3 cards comparison:');
        Object.keys(result.cards).forEach(rarity => {
            const actualCards = actualSet.cards[rarity].slice(0, 3);
            const testCards = result.cards[rarity].slice(0, 3);
            console.log(`${rarity.toUpperCase()}:`);
            console.log(`  Actual: ${actualCards.join(', ')}`);
            console.log(`  Test:   ${testCards.join(', ')}`);
        });
    } else {
        console.log(`\nNo actual set stored for week ${result.weekNumber} yet.`);
    }
    
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
    testWeeklySet()                         - Test current week (different from actual)
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
compareTestToActual(weekOffset?)            - Compare test set to actual stored set
testWithActualSeed(weekOffset?)             - Generate test set with same seed as actual
showThemeDistribution(start?, count?)       - Show theme distribution for multiple weeks
validateWeeklyUniqueness(week?, checkNext?) - Check card uniqueness between weeks
checkThemeUniqueness()                      - Check theme uniqueness in recent weeks
testThemedCards(theme?, count?)             - Test themed card generation for a specific theme
analyzeThematicDistribution(setId?)         - Analyze how thematic a generated set is
helpWeeklySetTesting()                      - Show this help

Note: testWeeklySet() generates DIFFERENT cards than stored sets by design.
      All sets now ensure unique themes and cards vs recent weeks.
      Use regenerateSet() to change existing sets with new uniqueness rules.
      Cards are now ~60% themed, 40% generic for variety within theme.
    `);
}

/**
 * Console helper: Test themed card generation for a specific theme
 * Usage: testThemedCards("Elemental Fury", 20)
 */
function testThemedCards(themeName = "Elemental Fury", count = 10) {
    if (!weeklySetGenerator.themeWordPools[themeName]) {
        console.log('Available themes:', Object.keys(weeklySetGenerator.themeWordPools));
        return;
    }
    
    console.log(`Testing themed card generation for "${themeName}":`);
    console.log('Sample cards:');
    
    let themedCount = 0;
    const cards = [];
    
    for (let i = 0; i < count; i++) {
        const seed = Date.now() + i * 1000;
        const card = weeklySetGenerator.generateCardName('common', seed, i, themeName);
        cards.push(card);
        
        // Check if card uses theme-specific words
        const themePool = weeklySetGenerator.themeWordPools[themeName];
        const isThemed = 
            themePool.adjectives.some(adj => card.includes(adj)) ||
            themePool.creatures.some(creature => card.includes(creature)) ||
            themePool.spells.some(spell => card.includes(spell)) ||
            themePool.artifacts.some(artifact => card.includes(artifact));
        
        if (isThemed) themedCount++;
        console.log(`  ${card}${isThemed ? ' [THEMED]' : ' [GENERIC]'}`);
    }
    
    console.log(`\nThematic distribution: ${themedCount}/${count} (${Math.round(themedCount/count*100)}%) cards use theme words`);
    console.log('Expected: ~60% themed, 40% generic for variety');
    
    return { cards, themedCount, totalCount: count, themePercentage: themedCount/count };
}

/**
 * Console helper: Analyze how thematic a generated set is
 * Usage: analyzeThematicDistribution() or analyzeThematicDistribution("Weekly_2025_W40")
 */
function analyzeThematicDistribution(setId = null) {
    let setData;
    
    if (setId) {
        const storageManager = window.storageManager || new StorageManager();
        const storedSets = storageManager.loadWeeklySets();
        setData = storedSets[setId];
        if (!setData) {
            console.log(`Set "${setId}" not found`);
            return;
        }
    } else {
        // Generate a test set for current week
        setData = weeklySetGenerator.testGenerateWeeklySet();
    }
    
    if (!setData.theme || !weeklySetGenerator.themeWordPools[setData.theme]) {
        console.log('Set has no theme or theme not found in word pools');
        return;
    }
    
    const themePool = weeklySetGenerator.themeWordPools[setData.theme];
    const results = {};
    let totalCards = 0;
    let totalThemed = 0;
    
    console.log(`Analyzing thematic distribution for "${setData.name}" (Theme: ${setData.theme}):`);
    
    Object.keys(setData.cards).forEach(rarity => {
        const cards = setData.cards[rarity];
        let themedCount = 0;
        
        cards.forEach(card => {
            const isThemed = 
                themePool.adjectives.some(adj => card.includes(adj)) ||
                themePool.creatures.some(creature => card.includes(creature)) ||
                themePool.spells.some(spell => card.includes(spell)) ||
                themePool.artifacts.some(artifact => card.includes(artifact));
            
            if (isThemed) themedCount++;
        });
        
        const percentage = Math.round(themedCount / cards.length * 100);
        results[rarity] = { themed: themedCount, total: cards.length, percentage };
        totalCards += cards.length;
        totalThemed += themedCount;
        
        console.log(`  ${rarity.toUpperCase()}: ${themedCount}/${cards.length} (${percentage}%) themed`);
    });
    
    const overallPercentage = Math.round(totalThemed / totalCards * 100);
    console.log(`\nOVERALL: ${totalThemed}/${totalCards} (${overallPercentage}%) cards use theme-specific words`);
    console.log('Target: ~60% themed for good thematic coherence with variety');
    
    return {
        setName: setData.name,
        theme: setData.theme,
        byRarity: results,
        overall: { themed: totalThemed, total: totalCards, percentage: overallPercentage }
    };
}

/**
 * Console helper: Generate test set using the same seed as the actual set
 */
function testWithActualSeed(weekOffset = 0) {
    const now = new Date();
    const targetWeek = weeklySetGenerator.getWeekNumber(now) + weekOffset;
    const year = now.getFullYear();
    const actualSeed = year * 1000 + targetWeek;
    
    console.log(`Generating test set with actual seed (${actualSeed}) for week ${targetWeek}:`);
    return testWeeklySet(weekOffset, actualSeed);
}

/**
 * Console helper: Compare test set to actual stored set
 */
function compareTestToActual(weekOffset = 0) {
    console.log('Generating comparison...\n');
    
    // Generate test set
    const testSet = testWeeklySet(weekOffset);
    
    return testSet; // The comparison is already shown in testWeeklySet
}

/**
 * Console helper: Show theme distribution for multiple weeks
 */
function showThemeDistribution(startWeek = 0, numWeeks = 10) {
    console.log(`Theme distribution for ${numWeeks} weeks starting from offset ${startWeek}:`);
    
    for (let i = 0; i < numWeeks; i++) {
        const weekOffset = startWeek + i;
        const now = new Date();
        const targetWeek = weeklySetGenerator.getWeekNumber(now) + weekOffset;
        const year = now.getFullYear();
        const seed = year * 1000 + targetWeek;
        
        // Use the unique theme selection logic
        const theme = weeklySetGenerator.selectUniqueTheme(seed, targetWeek, year);
        
        console.log(`Week ${targetWeek} (offset ${weekOffset}): ${theme.name}`);
    }
}

/**
 * Console helper: Validate uniqueness between consecutive weeks
 */
function validateWeeklyUniqueness(weekOffset = 0, checkNext = true) {
    const currentWeek = weeklySetGenerator.getWeekCardNames(weekOffset);
    const nextWeek = checkNext ? weeklySetGenerator.getWeekCardNames(weekOffset + 1) : weeklySetGenerator.getWeekCardNames(weekOffset - 1);
    
    if (currentWeek.length === 0 || nextWeek.length === 0) {
        console.log('One or both weeks have no stored cards to compare.');
        return;
    }
    
    const duplicates = currentWeek.filter(card => nextWeek.includes(card));
    
    console.log(`Checking uniqueness between week ${weekOffset} and ${checkNext ? weekOffset + 1 : weekOffset - 1}:`);
    console.log(`Week ${weekOffset} cards: ${currentWeek.length}`);
    console.log(`Comparison week cards: ${nextWeek.length}`);
    console.log(`Duplicate cards found: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
        console.log('Duplicate cards:', duplicates);
    } else {
        console.log('✅ All cards are unique between these weeks!');
    }
    
    return {
        week1Count: currentWeek.length,
        week2Count: nextWeek.length,
        duplicates: duplicates,
        isUnique: duplicates.length === 0
    };
}

/**
 * Console helper: Check theme uniqueness in recent weeks
 */
function checkThemeUniqueness() {
    const recentThemes = weeklySetGenerator.getRecentThemes(6);
    const uniqueThemes = [...new Set(recentThemes)];
    
    console.log('Recent theme usage (last 6 weeks):');
    console.log('Themes used:', recentThemes);
    console.log('Unique themes:', uniqueThemes.length, '/', recentThemes.length);
    console.log('Available themes:', weeklySetGenerator.themes.length);
    
    if (recentThemes.length !== uniqueThemes.length) {
        console.log('⚠️ Some themes were repeated recently');
    } else {
        console.log('✅ All recent themes are unique');
    }
    
    return {
        recentThemes: recentThemes,
        uniqueCount: uniqueThemes.length,
        totalAvailable: weeklySetGenerator.themes.length,
        hasRepeats: recentThemes.length !== uniqueThemes.length
    };
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
        helpWeeklySetTesting,
        testWithActualSeed,
        compareTestToActual,
        showThemeDistribution,
        validateWeeklyUniqueness,
        checkThemeUniqueness,
        testThemedCards,
        analyzeThematicDistribution
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
    window.testWithActualSeed = testWithActualSeed;
    window.compareTestToActual = compareTestToActual;
    window.showThemeDistribution = showThemeDistribution;
    window.validateWeeklyUniqueness = validateWeeklyUniqueness;
    window.checkThemeUniqueness = checkThemeUniqueness;
    window.testThemedCards = testThemedCards;
    window.analyzeThematicDistribution = analyzeThematicDistribution;
}
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
        const cardCounts = { common: 15, uncommon: 10, rare: 8, mythic: 4 };

        for (const rarity in cardCounts) {
            for (let i = 0; i < cardCounts[rarity]; i++) {
                const cardName = this.generateCardName(rarity, seed, i);
                cards[rarity].push(cardName);
            }
        }

        const { startOfWeek, endOfWeek } = this.getWeeklySetDates();

        return {
            name: `${theme.name} - Week ${targetWeek}`,
            totalCards: Object.values(cardCounts).reduce((a, b) => a + b, 0),
            packSize: 12,
            boosterBoxSize: 24, // Slightly smaller for weekly sets
            packComposition: { common: 7, uncommon: 3, rare: 1 },
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
}

// Create global instance
const weeklySetGenerator = new WeeklySetGenerator();

// Function to get all available sets (including current weekly set)
function getAllSets() {
    const allSets = { ...TCG_SETS };
    
    // Add current weekly set
    const weeklySet = weeklySetGenerator.getCurrentWeeklySet();
    const weeklyId = weeklySetGenerator.getWeeklySetId();
    allSets[weeklyId] = weeklySet;
    
    return allSets;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TCG_SETS, WeeklySetGenerator, weeklySetGenerator, getAllSets };
} else {
    window.TCG_SETS = TCG_SETS;
    window.WeeklySetGenerator = WeeklySetGenerator;
    window.weeklySetGenerator = weeklySetGenerator;
    window.getAllSets = getAllSets;
}
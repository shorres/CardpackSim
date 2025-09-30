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
        cards: {
            common: ["Clockwork Beetle", "Time-Worn Cobblestone", "Future Sight Adept", "Past Echoes", "Temporal Rift", "Wasteland Scavenger", "Gear Soldier", "Rusted Bolt", "Fading Memory", "Sandstorm Nomad", "Dune Wanderer", "Scrap Heap", "Bronze Automaton", "Steam-Powered Scout", "Chronovore Mite"],
            uncommon: ["Time Warden", "Paradox Engine", "Aetherium Tinkerer", "Rewind Clock", "Temporal Anchor", "Future Shock Trooper", "Cogwork Librarian", "Steam Blast", "Accelerated Timeline", "Ancient Ruins Guardian", "Oasis Watcher", "Junk Golem", "Brass Commander", "Power Cell", "Vision of Tomorrow"],
            rare: ["Master of Moments", "Time Sieve", "The Grand Orrery", "Temporal Distortion", "Lord of the Cogwork", "Future Primeval", "Aeon Chronicler", "Blast from the Past", "Timeline Collapse", "Colossus of the Wastes", "Mirage Mirror", "Scrap Trawler", "Chief of the Foundry", "Energy Conduit", "Glimpse the Unthinkable"],
            mythic: ["The Time Traveler", "Infinity Engine", "Aeon Wave", "Paradox Haze Lord", "Forge of Futures", "Chronomancer Prime", "Nexus of Fate", "The Great Desert Sphinx"]
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TCG_SETS };
} else {
    window.TCG_SETS = TCG_SETS;
}
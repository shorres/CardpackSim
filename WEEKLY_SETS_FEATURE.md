# Weekly Rotating Sets Feature

## Overview
The TCG Pack Simulator now includes a weekly rotating set system that automatically generates new, unique card sets every week based on the current date. This feature adds excitement and replayability by giving players limited-time content to collect.

## How It Works

### Weekly Set Generation
- **Time-Based**: Each week generates a unique set based on the current week number of the year
- **Seeded Random**: Uses deterministic generation so the same week always produces the same set
- **Themed Sets**: Each weekly set has a unique theme (e.g., "Elemental Fury", "Shadow Realm", "Divine Light")
- **Better Rates**: Weekly sets have improved mythic (1/6) and foil (1/4) chances compared to regular sets

### Set Composition
- **37 Total Cards**: 15 Common, 10 Uncommon, 8 Rare, 4 Mythic
- **Smaller Booster Boxes**: 24 packs instead of 30 for regular sets
- **Procedural Names**: Cards have generated names using themed word combinations
- **Three Card Types**: Creatures, Spells, and Artifacts with appropriate naming

### Card Name Generation
The system generates realistic card names by combining:
- **Rarity-based Adjectives**: More powerful adjectives for higher rarities
- **Card Types**: Creatures (Dragon, Knight, Wizard), Spells (Blast, Storm, Force), Artifacts (Sword, Crown, Orb)
- **Seeded Generation**: Same week always generates same cards for consistency

## Visual Features

### Special UI Elements
- **Gradient Styling**: Purple-to-pink gradient background for weekly packs
- **Golden Border**: Yellow border to highlight weekly packs
- **Weekly Badge**: "⏰ WEEKLY" indicator on pack displays
- **Countdown Timer**: Shows time remaining until new weekly set
- **Animated Glow**: Subtle pulsing glow effect on weekly packs

### Enhanced UX
- **Set Selector Styling**: Weekly sets appear with special colors in dropdown
- **Dynamic Button Text**: Booster box button shows correct pack count for each set
- **Featured Set Notification**: Banner highlighting the current weekly set
- **Auto-Refresh**: Page automatically refreshes when week changes

## Technical Implementation

### Core Components
1. **WeeklySetGenerator Class**: Handles all weekly set logic
2. **Seeded Random**: Ensures consistent generation for same week
3. **Theme System**: 8 different themes that rotate for variety
4. **Time Management**: Calculates week boundaries and countdown timers

### Integration Points
- **Data Layer**: `getAllSets()` function combines regular and weekly sets
- **Game Engine**: Modified to handle dynamic set lists
- **UI Manager**: Enhanced to display weekly set features
- **Storage**: Handles collection tracking for weekly sets

### Key Methods
```javascript
// Get current weekly set
weeklySetGenerator.getCurrentWeeklySet()

// Check time until next week
weeklySetGenerator.getTimeUntilNextWeek()

// Get all sets including weekly
getAllSets()
```

## Weekly Themes
1. **Elemental Fury** - Fire, water, earth, air magic
2. **Shadow Realm** - Darkness, death, undead creatures
3. **Divine Light** - Angels, healing, protection
4. **Wild Hunt** - Beasts, nature, growth
5. **Arcane Mysteries** - Magic, knowledge, illusion
6. **Mechanical Marvel** - Artifacts, constructs, technology
7. **Warrior's Code** - Combat, honor, strength
8. **Temporal Nexus** - Time, space, dimension

## Future Enhancements (Ready for Implementation)
- **Currency System**: Add coins/gems for strategic pack purchasing
- **Weekly Challenges**: Special objectives for weekly sets
- **Limited Availability**: Make weekly sets purchasable only during their week
- **Achievement System**: Rewards for collecting full weekly sets
- **Rarity Distribution**: Different weekly themes could have different rarity balances

## Player Benefits
- **Fresh Content**: New cards to discover every week
- **Collection Goals**: Short-term objectives with weekly sets
- **Better Rates**: Improved chances for rare cards
- **FOMO Element**: Limited-time content encourages regular play
- **Variety**: Different themes keep gameplay interesting

The weekly set system is fully functional and ready to use, with room for future expansion into more complex progression systems!
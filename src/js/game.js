// Core Game Logic
class GameEngine {
    constructor() {
        this.state = {
            unopenedPacks: {},
            collection: {},
            selectedSet: Object.keys(window.TCG_SETS)[0],
        };
        this.storageManager = new StorageManager();
        this.initializeState();
    }

    initializeState() {
        // Get all sets including weekly ones
        const allSets = window.getAllSets();
        
        // Initialize state for all sets
        Object.keys(allSets).forEach(setId => {
            if (!this.state.unopenedPacks[setId]) this.state.unopenedPacks[setId] = 0;
            if (!this.state.collection[setId]) this.state.collection[setId] = {};
        });

        // Load saved state if available
        const savedState = this.storageManager.loadState();
        if (savedState) {
            this.state = savedState;
            
            // Ensure new sets are initialized even in loaded state
            Object.keys(allSets).forEach(setId => {
                if (!this.state.unopenedPacks[setId]) this.state.unopenedPacks[setId] = 0;
                if (!this.state.collection[setId]) this.state.collection[setId] = {};
            });
        }
    }

    buyPacks(amount) {
        this.state.unopenedPacks[this.state.selectedSet] += amount;
        this.saveState();
        return this.state.unopenedPacks[this.state.selectedSet];
    }

    generatePackContents(setId) {
        const allSets = window.getAllSets();
        const set = allSets[setId];
        const openedCards = [];
        
        // Generate common and uncommon cards
        for (const rarity in set.packComposition) {
            if (rarity === 'rare') continue;
            for (let i = 0; i < set.packComposition[rarity]; i++) {
                const cardPool = set.cards[rarity];
                const cardName = cardPool[Math.floor(Math.random() * cardPool.length)];
                openedCards.push({ name: cardName, rarity: rarity, isFoil: false });
            }
        }

        // Generate rare/mythic slot
        const isMythic = Math.random() < set.mythicChance;
        const rareSlotRarity = isMythic ? 'mythic' : 'rare';
        const rareSlotPool = set.cards[rareSlotRarity];
        const rareSlotCardName = rareSlotPool[Math.floor(Math.random() * rareSlotPool.length)];
        openedCards.push({ name: rareSlotCardName, rarity: rareSlotRarity, isFoil: false });

        // Apply foil effect randomly
        if (Math.random() < set.foilChance) {
            const foilIndex = Math.floor(Math.random() * openedCards.length);
            openedCards[foilIndex].isFoil = true;
        }

        return openedCards;
    }

    openPack(setId) {
        if (this.state.unopenedPacks[setId] <= 0) {
            return null;
        }

        const cards = this.generatePackContents(setId);
        this.state.unopenedPacks[setId]--;
        this.addCardsToCollection(setId, cards);
        this.saveState();
        
        return cards;
    }

    addCardsToCollection(setId, cards) {
        cards.forEach(card => {
            const collectionSet = this.state.collection[setId];
            if (!collectionSet[card.name]) {
                collectionSet[card.name] = { count: 0, foilCount: 0 };
            }
            collectionSet[card.name].count++;
            if (card.isFoil) {
                collectionSet[card.name].foilCount++;
            }
        });
    }

    getCardRarity(setId, cardName) {
        const allSets = window.getAllSets();
        const set = allSets[setId];
        for (const rarity in set.cards) {
            if (set.cards[rarity].includes(cardName)) {
                return rarity;
            }
        }
        return 'common';
    }

    getCollectionProgress(setId) {
        const allSets = window.getAllSets();
        const set = allSets[setId];
        const collectionSet = this.state.collection[setId];
        let collectedCount = 0;
        
        const allCardsInSet = [
            ...set.cards.common.map(name => ({name, rarity: 'common'})),
            ...set.cards.uncommon.map(name => ({name, rarity: 'uncommon'})),
            ...set.cards.rare.map(name => ({name, rarity: 'rare'})),
            ...set.cards.mythic.map(name => ({name, rarity: 'mythic'})),
        ];

        allCardsInSet.forEach(cardInfo => {
            const cardData = collectionSet[cardInfo.name];
            const count = cardData ? cardData.count : 0;
            if (count > 0) collectedCount++;
        });
        
        const totalSetCards = allCardsInSet.length;
        const percentage = totalSetCards > 0 ? ((collectedCount / totalSetCards) * 100).toFixed(1) : 0;
        
        return {
            collected: collectedCount,
            total: totalSetCards,
            percentage: percentage,
            allCards: allCardsInSet
        };
    }

    setSelectedSet(setId) {
        this.state.selectedSet = setId;
        this.saveState();
    }

    saveState() {
        this.storageManager.saveState(this.state);
    }

    resetGame() {
        this.state = {
            unopenedPacks: {},
            collection: {},
            selectedSet: Object.keys(window.getAllSets())[0],
        };
        this.initializeState();
        this.storageManager.clearState();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameEngine };
} else {
    window.GameEngine = GameEngine;
}
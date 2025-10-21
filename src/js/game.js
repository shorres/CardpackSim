// Core Game Logic
class GameEngine {
    constructor() {
        this.state = {
            unopenedPacks: {},
            collection: {},
            selectedSet: this.getDefaultSet(),
            // Economic state
            wallet: 20.00, // Starting money
            totalEarnings: 0,
            totalSpent: 0,
            netWorth: 20.00,
            achievements: [],
            currentTitle: "Rookie Trader",
            unlockedBanners: [],
            unlockedPortraits: [],
            // Profile tracking
            salesCount: 0,
            highestSale: 0,
            netWorthHistory: [{ timestamp: Date.now(), value: 20.00 }],
            selectedPortrait: "👤",
            // Card lock settings
            cardLockSettings: {
                keepOne: false,
                keepFoils: false,
                keepOneFoil: false,
                keepMythics: false,
                keepRares: false
            }
        };
        this.storageManager = new StorageManager();
        // Make storage manager globally available for getAllSets function
        window.storageManager = this.storageManager;
        this.marketEngine = new MarketEngine();
        this.initializeState();
    }

    getDefaultSet() {
        try {
            // Try to get all sets first
            const allSets = window.getAllSets ? window.getAllSets() : window.TCG_SETS;
            if (allSets && typeof allSets === 'object') {
                const setKeys = Object.keys(allSets);
                if (setKeys.length > 0) {
                    return setKeys[0];
                }
            }
            // Fallback to a hardcoded set if nothing else works
            return 'base-set';
        } catch (error) {
            console.warn('Error getting default set:', error);
            return 'base-set';
        }
    }

    initializeState() {
        // Get all sets including weekly ones with defensive checks
        let allSets;
        try {
            allSets = window.getAllSets ? window.getAllSets() : window.TCG_SETS;
            if (!allSets || typeof allSets !== 'object') {
                console.warn('No sets available, using empty object');
                allSets = {};
            }
        } catch (error) {
            console.error('Error getting all sets:', error);
            allSets = {};
        }
        
        // Initialize state for all sets
        Object.keys(allSets).forEach(setId => {
            if (!this.state.unopenedPacks[setId]) this.state.unopenedPacks[setId] = 0;
            if (!this.state.collection[setId]) this.state.collection[setId] = {};
        });

        // Load saved state if available
        const savedState = this.storageManager.loadState();
        if (savedState) {
            this.state = { ...this.state, ...savedState };
            
            // Load market state to preserve baseline prices
            const savedMarketState = this.storageManager.loadMarketState();
            if (savedMarketState) {
                this.marketEngine.setState(savedMarketState);
            }
            
            // Ensure new sets are initialized even in loaded state
            Object.keys(allSets).forEach(setId => {
                if (!this.state.unopenedPacks[setId]) this.state.unopenedPacks[setId] = 0;
                if (!this.state.collection[setId]) this.state.collection[setId] = {};
            });
            
            // Initialize economy fields for existing saves
            if (typeof this.state.wallet === 'undefined') {
                this.state.wallet = 20.00;
                this.state.totalEarnings = 0;
                this.state.totalSpent = 0;
                this.state.netWorth = 20.00;
                this.state.achievements = [];
                this.state.currentTitle = "Rookie Trader";
                this.state.unlockedBanners = [];
                this.state.unlockedPortraits = [];
            }
            
            // Initialize profile tracking fields for existing saves
            if (typeof this.state.salesCount === 'undefined') {
                this.state.salesCount = 0;
                this.state.highestSale = 0;
                this.state.selectedPortrait = "👤";
            }
            if (!this.state.netWorthHistory) {
                this.state.netWorthHistory = [{ timestamp: Date.now(), value: this.state.netWorth }];
            }
        }
        
        // Update net worth on initialization
        this.updateNetWorth();
        
        // Add some sample net worth history for testing if empty
        if (this.state.netWorthHistory.length === 1) {
            this.generateSampleNetWorthHistory();
        }
    }

    buyPacks(amount) {
        const packCost = this.marketEngine.getPackPrice(this.state.selectedSet, amount);
        
        if (this.state.wallet < packCost) {
            return { success: false, message: "Insufficient funds", cost: packCost };
        }
        
        this.state.wallet = Math.round((this.state.wallet - packCost) * 100) / 100;
        this.state.totalSpent = Math.round((this.state.totalSpent + packCost) * 100) / 100;
        this.state.unopenedPacks[this.state.selectedSet] += amount;
        
        this.updateNetWorth();
        this.recordNetWorthHistory();
        this.saveState();
        
        return { 
            success: true, 
            message: `Purchased ${amount} pack(s) for $${packCost.toFixed(2)}`,
            cost: packCost,
            remainingMoney: this.state.wallet
        };
    }

    generatePackContents(setId) {
        const allSets = window.getAllSets();
        const set = allSets[setId];
        
        if (!set) {
            console.error(`Cannot generate pack contents for undefined set: ${setId}`);
            return [];
        }
        
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
        
        // Record market data for opened cards
        cards.forEach(card => {
            this.marketEngine.recordCardOpened(setId, card.name, card.isFoil);
        });
        
        this.updateNetWorth();
        this.saveState();
        
        return cards;
    }

    addCardsToCollection(setId, cards) {
        cards.forEach(card => {
            const collectionSet = this.state.collection[setId];
            if (!collectionSet[card.name]) {
                collectionSet[card.name] = { count: 0, foilCount: 0 };
            }
            
            // Fix: Only increment count for regular cards, foilCount for foil cards
            if (card.isFoil) {
                collectionSet[card.name].foilCount++;
            } else {
                collectionSet[card.name].count++;
            }
        });
    }

    getCardRarity(setId, cardName) {
        const allSets = window.getAllSets();
        const set = allSets[setId];
        
        if (!set) {
            console.warn(`Cannot get card rarity for undefined set: ${setId}`);
            return 'common';
        }
        
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
        
        if (!set) {
            console.warn(`Cannot get collection progress for undefined set: ${setId}`);
            return { collected: 0, total: 0, percentage: 0 };
        }
        
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
            // Fix: Count cards where player has ANY version (regular OR foil)
            const totalOwned = cardData ? (cardData.count + cardData.foilCount) : 0;
            if (totalOwned > 0) collectedCount++;
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

    // Economic methods

    updateNetWorth() {
        let portfolioValue = 0;
        
        // Calculate value of all cards in collection
        Object.keys(this.state.collection).forEach(setId => {
            Object.keys(this.state.collection[setId]).forEach(cardName => {
                const cardData = this.state.collection[setId][cardName];
                const regularPrice = this.marketEngine.getCardPrice(setId, cardName, false);
                const foilPrice = this.marketEngine.getCardPrice(setId, cardName, true);
                
                portfolioValue += (cardData.count - cardData.foilCount) * regularPrice;
                portfolioValue += cardData.foilCount * foilPrice;
            });
        });
        
        this.state.netWorth = Math.round((this.state.wallet + portfolioValue) * 100) / 100;
        return this.state.netWorth;
    }

    // Helper method to calculate available quantity for sale considering locks
    getAvailableQuantityForSale(setId, cardName, isFoil) {
        const collectionSet = this.state.collection[setId];
        if (!collectionSet || !collectionSet[cardName]) {
            return 0;
        }
        
        const cardData = collectionSet[cardName];
        const rarity = this.getCardRarity(setId, cardName);
        const settings = this.state.cardLockSettings;
        
        let availableQuantity;
        let lockedQuantity = 0;
        
        if (isFoil) {
            availableQuantity = cardData.foilCount;
            
            // Calculate locked foil cards
            if (settings.keepFoils) {
                lockedQuantity = availableQuantity; // Lock all foils
            } else if (settings.keepOneFoil && availableQuantity > 0) {
                lockedQuantity = 1; // Lock one foil
            }
            
            // Check rarity-based locks for foils
            if (settings.keepMythics && rarity === 'mythic') {
                lockedQuantity = Math.max(lockedQuantity, availableQuantity);
            }
            if (settings.keepRares && rarity === 'rare') {
                lockedQuantity = Math.max(lockedQuantity, availableQuantity);
            }
        } else {
            availableQuantity = cardData.count;
            
            // Calculate locked regular cards
            if (settings.keepOne && availableQuantity > 0) {
                lockedQuantity = 1; // Lock one regular card
            }
            
            // Check rarity-based locks for regular cards
            if (settings.keepMythics && rarity === 'mythic') {
                lockedQuantity = Math.max(lockedQuantity, availableQuantity);
            }
            if (settings.keepRares && rarity === 'rare') {
                lockedQuantity = Math.max(lockedQuantity, availableQuantity);
            }
        }
        
        return Math.max(0, availableQuantity - lockedQuantity);
    }

    sellCard(setId, cardName, quantity, isFoil = false) {
        const collectionSet = this.state.collection[setId];
        if (!collectionSet || !collectionSet[cardName]) {
            return { success: false, message: "Card not found in collection" };
        }
        
        const availableQuantity = this.getAvailableQuantityForSale(setId, cardName, isFoil);
        
        if (quantity > availableQuantity) {
            const rarity = this.getCardRarity(setId, cardName);
            const cardType = isFoil ? 'foil' : 'regular';
            let lockReason = '';
            
            if (availableQuantity === 0) {
                if (this.state.cardLockSettings.keepFoils && isFoil) {
                    lockReason = ' (all foils are locked)';
                } else if (this.state.cardLockSettings.keepOne && !isFoil) {
                    lockReason = ' (keeping 1 of each card)';
                } else if (this.state.cardLockSettings.keepMythics && rarity === 'mythic') {
                    lockReason = ' (all mythics are locked)';
                } else if (this.state.cardLockSettings.keepRares && rarity === 'rare') {
                    lockReason = ' (all rares are locked)';
                }
            }
            
            return { success: false, message: `Not enough ${cardType} cards available for sale. You have ${availableQuantity} available${lockReason}.` };
        }
        
        const salePrice = this.marketEngine.getCardPrice(setId, cardName, isFoil);
        const totalValue = Math.round(salePrice * quantity * 100) / 100;
        
        // Apply trading fee (5% for instant sales)
        const fee = Math.round(totalValue * 0.05 * 100) / 100;
        const netValue = Math.round((totalValue - fee) * 100) / 100;
        
        // Get card data for updating collection
        const cardData = collectionSet[cardName];
        
        // Update collection
        if (isFoil) {
            cardData.foilCount -= quantity;
        } else {
            // Remove regular cards, keeping foils
            cardData.count -= quantity;
        }
        
        // Clean up empty entries
        if (cardData.count === 0 && cardData.foilCount === 0) {
            delete collectionSet[cardName];
        }
        
        // Update wallet and earnings
        this.state.wallet = Math.round((this.state.wallet + netValue) * 100) / 100;
        this.state.totalEarnings = Math.round((this.state.totalEarnings + netValue) * 100) / 100;
        
        // Track sales statistics for profile
        this.state.salesCount++;
        if (netValue > this.state.highestSale) {
            this.state.highestSale = netValue;
        }
        
        this.updateNetWorth();
        this.recordNetWorthHistory();
        this.checkAchievements();
        this.saveState();
        
        return {
            success: true,
            message: `Sold ${quantity}x ${cardName} for $${totalValue.toFixed(2)} (net: $${netValue.toFixed(2)})`,
            grossValue: totalValue,
            netValue: netValue,
            fee: fee,
            newWallet: this.state.wallet
        };
    }

    getPortfolioSummary() {
        const portfolio = [];
        let totalValue = 0;
        
        Object.keys(this.state.collection).forEach(setId => {
            Object.keys(this.state.collection[setId]).forEach(cardName => {
                const cardData = this.state.collection[setId][cardName];
                const regularPrice = this.marketEngine.getCardPrice(setId, cardName, false);
                const foilPrice = this.marketEngine.getCardPrice(setId, cardName, true);
                
                const regularValue = cardData.count * regularPrice;
                const foilValue = cardData.foilCount * foilPrice;
                const cardTotalValue = regularValue + foilValue;
                
                if (cardTotalValue > 0) {
                    portfolio.push({
                        setId,
                        cardName,
                        regularCount: cardData.count,
                        foilCount: cardData.foilCount,
                        regularPrice,
                        foilPrice,
                        totalValue: Math.round(cardTotalValue * 100) / 100,
                        individualPrice: regularPrice, // Show individual card price instead of total
                        rarity: this.getCardRarity(setId, cardName),
                        trend: this.marketEngine.getCardTrend(setId, cardName)
                    });
                    totalValue += cardTotalValue;
                }
            });
        });
        
        return {
            cards: portfolio.sort((a, b) => b.totalValue - a.totalValue),
            totalValue: Math.round(totalValue * 100) / 100,
            cardCount: portfolio.length
        };
    }

    checkAchievements() {
        const achievements = [
            { id: 'card_flipper', threshold: 100, title: 'Card Flipper', reward: 0 },
            { id: 'market_novice', threshold: 250, title: 'Market Novice', reward: 25 },
            { id: 'trader', threshold: 1000, title: 'Trader', reward: 0 },
            { id: 'market_savvy', threshold: 2500, title: 'Market Savvy', reward: 0 },
            { id: 'serious_trader', threshold: 5000, title: 'Serious Trader', reward: 0 },
            { id: 'market_master', threshold: 15000, title: 'Market Master', reward: 0 },
            { id: 'whale', threshold: 25000, title: 'Whale', reward: 0 },
            { id: 'diamond_trader', threshold: 50000, title: 'Diamond Trader', reward: 0 }
        ];
        
        achievements.forEach(achievement => {
            if (this.state.totalEarnings >= achievement.threshold && 
                !this.state.achievements.includes(achievement.id)) {
                
                this.state.achievements.push(achievement.id);
                this.state.currentTitle = achievement.title;
                
                if (achievement.reward > 0) {
                    this.state.wallet = Math.round((this.state.wallet + achievement.reward) * 100) / 100;
                }
                
                // Trigger achievement notification
                if (window.tcgApp && window.tcgApp.uiManager) {
                    window.tcgApp.uiManager.showAchievementNotification(achievement);
                }
            }
        });
    }

    recordNetWorthHistory() {
        const now = Date.now();
        const currentValue = this.state.netWorth;
        
        // Only record if it's been at least 5 minutes since last recording or value changed significantly
        const lastEntry = this.state.netWorthHistory[this.state.netWorthHistory.length - 1];
        const timeDiff = now - lastEntry.timestamp;
        const valueDiff = Math.abs(currentValue - lastEntry.value);
        
        if (timeDiff > 5 * 60 * 1000 || valueDiff > 0.01) { // 5 minutes or $0.01 change
            this.state.netWorthHistory.push({ timestamp: now, value: currentValue });
            
            // Keep only last 100 entries to prevent excessive data
            if (this.state.netWorthHistory.length > 100) {
                this.state.netWorthHistory = this.state.netWorthHistory.slice(-100);
            }
        }
    }

    generateSampleNetWorthHistory() {
        // Generate some sample data points over the last few days for demo purposes
        const now = Date.now();
        const sampleData = [];
        
        // Start from 3 days ago
        for (let i = 72; i >= 0; i -= 6) { // Every 6 hours for 3 days
            const timestamp = now - (i * 60 * 60 * 1000); // i hours ago
            const baseValue = 20 + (72 - i) * 2; // Gradual increase
            const variance = (Math.random() - 0.5) * 20; // Random variance
            const value = Math.max(10, baseValue + variance); // Ensure minimum value
            
            sampleData.push({ timestamp, value: Math.round(value * 100) / 100 });
        }
        
        this.state.netWorthHistory = sampleData;
        this.state.netWorthHistory.push({ timestamp: now, value: this.state.netWorth });
    }

    getPlayerStats() {
        return {
            wallet: this.state.wallet,
            netWorth: this.state.netWorth,
            totalEarnings: this.state.totalEarnings,
            totalSpent: this.state.totalSpent,
            profit: Math.round((this.state.totalEarnings - this.state.totalSpent) * 100) / 100,
            currentTitle: this.state.currentTitle,
            achievements: this.state.achievements,
            unlockedBanners: this.state.unlockedBanners,
            unlockedPortraits: this.state.unlockedPortraits,
            salesCount: this.state.salesCount,
            highestSale: this.state.highestSale,
            netWorthHistory: this.state.netWorthHistory,
            selectedPortrait: this.state.selectedPortrait
        };
    }

    saveState() {
        // Also save market state
        const marketState = this.marketEngine.getState();
        this.storageManager.saveState(this.state);
        this.storageManager.saveMarketState(marketState);
    }

    resetGame() {
        this.state = {
            unopenedPacks: {},
            collection: {},
            selectedSet: this.getDefaultSet(),
            wallet: 20.00,
            totalEarnings: 0,
            totalSpent: 0,
            netWorth: 20.00,
            achievements: [],
            currentTitle: "Rookie Trader",
            unlockedBanners: [],
            unlockedPortraits: [],
            // Profile tracking
            salesCount: 0,
            highestSale: 0,
            netWorthHistory: [{ timestamp: Date.now(), value: 20.00 }],
            selectedPortrait: "👤"
        };
        
        // Reset the market engine to initial state
        this.marketEngine = new MarketEngine();
        
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
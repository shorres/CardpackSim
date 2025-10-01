// Market Simulation Engine
class MarketEngine {
    constructor() {
        this.state = {
            cardPrices: {},
            marketSentiment: 1.0, // 0.8-1.2 range
            priceHistory: {},
            supplyData: {},
            demandEvents: [],
            lastPriceUpdate: Date.now(),
            totalMarketValue: 0,
            
            // Trading Market Extensions
            wishlist: [], // [{ setId, cardName, maxPrice, isFoil, priority, addedAt }]
            marketListings: {}, // { setId: { cardName: [{ price, quantity, isFoil, sellerId, listedAt, duration }] } }
            marketActivity: [], // Recent trading activity
            aiTraders: [] // AI trader instances
        };
        
        this.config = {
            // Pack pricing
            packPrices: {
                standard: 6.00,
                weekly: 10.00,
                boosterBoxDiscount: 0.1 // 4% discount for boxes
            },
            
            // Base price ranges by rarity
            basePriceRanges: {
                common: { min: 0.05, max: 0.50 },
                uncommon: { min: 0.50, max: 2.00 },
                rare: { min: 2.00, max: 8.00 },
                mythic: { min: 8.00, max: 25.00 }
            },
            
            // Market modifiers
            setMultipliers: {
                standard: 1.0,
                weekly: 1.3,
                legacy: 0.8
            },
            
            foilMultiplier: { min: 2.0, max: 4.0 },
            
            // Market dynamics
            supplyImpact: 0.005, // Price reduction per card opened
            maxPriceChange: 0.15, // 15% max change per update
            volatilityRange: 0.05, // ±5% random volatility
            demandEventChance: 0.02, // 2% chance per card per update
            sentimentChangeRate: 0.001, // How fast sentiment changes
            
            // Update frequency
            priceUpdateInterval: 60000, // 1 minute (increased frequency)
            historyRetentionDays: 7, // Keep 7 days for charts
            chartDataPoints: 200, // Max data points for charts (increased)
            
            // Trading Market Settings
            maxListingsPerCard: 5, // Maximum concurrent listings for same card
            listingFee: 0.03, // 3% fee affects AI trader pricing
            priceVariance: 0.15, // ±15% variance from market price
            wishlistNotificationThreshold: 1.10, // Notify if price within 110% of wishlist max
            
            // AI trader behaviors
            traderTypes: [
                { type: 'casual', listingChance: 0.3, priceMultiplier: 0.9, holdTime: 2 },
                { type: 'flipper', listingChance: 0.6, priceMultiplier: 1.2, holdTime: 0.5 },
                { type: 'collector', listingChance: 0.1, priceMultiplier: 1.5, holdTime: 7 },
                { type: 'whale', listingChance: 0.05, priceMultiplier: 2.0, holdTime: 14 }
            ],
            
            // Price recording intervals (in minutes)
            recordingIntervals: {
                shortTerm: 30,  // 30 minutes for 24h charts (48 points)
                mediumTerm: 60, // 1 hour for 2-day charts (48 points)
                longTerm: 240   // 4 hours for 1-week charts (42 points)
            }
        };
        
        this.eventTypes = [
            { name: 'meta_shift', multiplier: 1.5, duration: 3600000, chance: 0.3 }, // 1 hour
            { name: 'tournament_play', multiplier: 2.0, duration: 7200000, chance: 0.2 }, // 2 hours  
            { name: 'content_creator', multiplier: 1.8, duration: 1800000, chance: 0.3 }, // 30 minutes
            { name: 'speculation', multiplier: 1.3, duration: 900000, chance: 0.2 } // 15 minutes
        ];
        
        this.updateInterval = null;
        this.initializeMarket();
    }

    initializeMarket() {
        // Initialize prices for all existing cards
        const allSets = window.getAllSets();
        Object.keys(allSets).forEach(setId => {
            this.initializeSetPrices(setId, allSets[setId]);
        });
        
        // Initialize trading market
        this.initializeMarketListings();
        
        // Start price update cycle
        this.startPriceUpdates();
    }

    initializeSetPrices(setId, setData) {
        if (!setData) {
            console.warn(`Cannot initialize prices for undefined set: ${setId}`);
            return;
        }
        
        if (!this.state.cardPrices[setId]) {
            this.state.cardPrices[setId] = {};
            this.state.priceHistory[setId] = {};
            this.state.supplyData[setId] = {};
        }

        let setMultiplier = setData.isWeekly ? this.config.setMultipliers.weekly : this.config.setMultipliers.standard;
        
        // Apply lifecycle pricing for weekly sets
        if (setData.isWeekly && setData.lifecycle) {
            switch (setData.lifecycle) {
                case 'featured':
                    setMultiplier *= 1.0; // Full weekly pricing
                    break;
                case 'standard':
                    setMultiplier *= 0.9; // Slight reduction
                    break;
                case 'legacy':
                    setMultiplier *= 0.7; // Significant reduction for legacy
                    break;
            }
        }
        
        // Initialize prices for each rarity
        if (!setData.cards) {
            console.warn(`Set ${setId} has no cards structure, skipping price initialization`);
            return;
        }
        
        Object.keys(setData.cards).forEach(rarity => {
            const cardsInRarity = setData.cards[rarity];
            if (!Array.isArray(cardsInRarity)) {
                console.warn(`Set ${setId} rarity ${rarity} is not an array during price initialization, skipping`);
                return;
            }
            
            cardsInRarity.forEach(cardName => {
                if (!this.state.cardPrices[setId][cardName]) {
                    const basePrice = this.generateBasePrice(rarity, setMultiplier);
                    
                    this.state.cardPrices[setId][cardName] = {
                        currentPrice: basePrice,
                        basePrice: basePrice,
                        foilPrice: basePrice * this.generateFoilMultiplier(),
                        lastChange: 0,
                        trend: 'stable' // 'rising', 'falling', 'stable'
                    };
                    
                    this.state.priceHistory[setId][cardName] = this.generateInitialPriceHistory(basePrice);
                    
                    this.state.supplyData[setId][cardName] = {
                        totalOpened: 0,
                        marketSupply: 0,
                        demandMultiplier: 1.0
                    };
                }
            });
        });
    }

    generateBasePrice(rarity, setMultiplier) {
        const range = this.config.basePriceRanges[rarity];
        const randomFactor = Math.random();
        
        // Use power distribution to make lower prices more common
        const adjustedRandom = Math.pow(randomFactor, 1.5);
        const basePrice = range.min + (range.max - range.min) * adjustedRandom;
        
        return Math.round(basePrice * setMultiplier * 100) / 100;
    }

    generateFoilMultiplier() {
        const min = this.config.foilMultiplier.min;
        const max = this.config.foilMultiplier.max;
        return min + Math.random() * (max - min);
    }

    generateInitialPriceHistory(basePrice) {
        const history = [];
        const now = Date.now();
        const hoursBack = 168; // Generate 7 days of history (7 * 24 = 168 hours)
        const intervalMinutes = this.config.recordingIntervals.shortTerm; // Use consistent 30-minute intervals
        const intervalMs = intervalMinutes * 60 * 1000;
        
        let currentPrice = basePrice;
        
        // Generate data points going backwards in time at 30-minute intervals
        for (let h = 0; h <= hoursBack * 2; h++) { // *2 because we're doing 30-minute intervals (2 per hour)
            const timestamp = now - (h * intervalMs);
            
            // Add some realistic price movement
            const changePercent = (Math.random() - 0.5) * 0.1; // ±5% change
            currentPrice *= (1 + changePercent);
            
            // Keep price within reasonable bounds (±50% of base)
            currentPrice = Math.max(basePrice * 0.5, Math.min(basePrice * 1.5, currentPrice));
            
            history.unshift({ // Add to beginning since we're going backwards
                timestamp: timestamp,
                price: Math.round(currentPrice * 100) / 100,
                volume: 0
            });
        }
        
        return history;
    }

    startPriceUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            this.updateMarketPrices();
        }, this.config.priceUpdateInterval);
    }

    updateMarketPrices() {
        this.updateMarketSentiment();
        this.processSupplyChanges();
        this.updateDemandEvents();
        this.applyPriceChanges();
        this.updateMarketListings(); // Add trading market updates
        this.cleanupOldData();
        
        this.state.lastPriceUpdate = Date.now();
        
        // Notify UI of price changes
        if (window.tcgApp && window.tcgApp.uiManager) {
            window.tcgApp.uiManager.onMarketUpdate();
        }
    }

    updateMarketSentiment() {
        // Slow random walk for overall market sentiment
        const change = (Math.random() - 0.5) * this.config.sentimentChangeRate * 2;
        this.state.marketSentiment = Math.max(0.8, Math.min(1.2, this.state.marketSentiment + change));
    }

    processSupplyChanges() {
        // This will be called when cards are opened
        // For now, just simulate some background activity
        const allSets = window.getAllSets();
        Object.keys(allSets).forEach(setId => {
            if (this.state.supplyData[setId]) {
                Object.keys(this.state.supplyData[setId]).forEach(cardName => {
                    // Simulate occasional background pack openings
                    if (Math.random() < 0.001) { // 0.1% chance per card per update
                        this.recordCardOpened(setId, cardName, false);
                    }
                });
            }
        });
    }

    updateDemandEvents() {
        const now = Date.now();
        
        // Remove expired events
        this.state.demandEvents = this.state.demandEvents.filter(event => 
            now < event.expiresAt
        );
        
        // Randomly create new demand events
        const allSets = window.getAllSets();
        Object.keys(allSets).forEach(setId => {
            if (this.state.cardPrices[setId]) {
                Object.keys(this.state.cardPrices[setId]).forEach(cardName => {
                    if (Math.random() < this.config.demandEventChance) {
                        this.createDemandEvent(setId, cardName);
                    }
                });
            }
        });
    }

    createDemandEvent(setId, cardName) {
        // Don't create multiple events for the same card
        const existingEvent = this.state.demandEvents.find(event => 
            event.setId === setId && event.cardName === cardName
        );
        
        if (existingEvent) return;
        
        const eventType = this.eventTypes[Math.floor(Math.random() * this.eventTypes.length)];
        
        this.state.demandEvents.push({
            setId,
            cardName,
            type: eventType.name,
            multiplier: eventType.multiplier,
            expiresAt: Date.now() + eventType.duration,
            createdAt: Date.now()
        });
    }

    applyPriceChanges() {
        const allSets = window.getAllSets();
        Object.keys(allSets).forEach(setId => {
            if (this.state.cardPrices[setId]) {
                Object.keys(this.state.cardPrices[setId]).forEach(cardName => {
                    this.updateCardPrice(setId, cardName);
                });
            }
        });
    }

    updateCardPrice(setId, cardName) {
        const cardData = this.state.cardPrices[setId][cardName];
        const supplyData = this.state.supplyData[setId][cardName];
        
        if (!cardData || !supplyData) return;
        
        let newPrice = cardData.basePrice;
        
        // Apply supply pressure
        const supplyReduction = Math.max(0, 1 - (supplyData.totalOpened * this.config.supplyImpact));
        newPrice *= supplyReduction;
        
        // Apply demand events
        const demandEvent = this.state.demandEvents.find(event => 
            event.setId === setId && event.cardName === cardName
        );
        if (demandEvent) {
            newPrice *= demandEvent.multiplier;
        }
        
        // Apply market sentiment
        newPrice *= this.state.marketSentiment;
        
        // Apply random volatility
        const volatility = 1 + (Math.random() - 0.5) * this.config.volatilityRange * 2;
        newPrice *= volatility;
        
        // Limit maximum price change per update
        const maxChange = cardData.currentPrice * this.config.maxPriceChange;
        const change = newPrice - cardData.currentPrice;
        if (Math.abs(change) > maxChange) {
            newPrice = cardData.currentPrice + (change > 0 ? maxChange : -maxChange);
        }
        
        // Ensure minimum price
        newPrice = Math.max(0.01, newPrice);
        
        // Update price and trend
        const oldPrice = cardData.currentPrice;
        cardData.currentPrice = Math.round(newPrice * 100) / 100;
        cardData.lastChange = ((cardData.currentPrice - oldPrice) / oldPrice) * 100;
        
        // Update trend
        if (cardData.lastChange > 2) cardData.trend = 'rising';
        else if (cardData.lastChange < -2) cardData.trend = 'falling';
        else cardData.trend = 'stable';
        
        // Update foil price
        cardData.foilPrice = Math.round(cardData.currentPrice * this.generateFoilMultiplier() * 100) / 100;
        
        // Record price history
        this.recordPriceHistory(setId, cardName, cardData.currentPrice);
    }

    recordPriceHistory(setId, cardName, price) {
        if (!this.state.priceHistory[setId] || !this.state.priceHistory[setId][cardName]) {
            return;
        }
        
        const history = this.state.priceHistory[setId][cardName];
        const now = Date.now();
        
        // Determine if we should record based on time intervals
        const shouldRecord = this.shouldRecordPricePoint(history, now);
        
        if (shouldRecord) {
            history.push({
                timestamp: now,
                price: price,
                volume: 0 // We'll track this when implementing actual trading
            });
            
            // Keep only recent history for charts
            const cutoffTime = now - (this.config.historyRetentionDays * 24 * 60 * 60 * 1000);
            this.state.priceHistory[setId][cardName] = 
                this.state.priceHistory[setId][cardName].filter(entry => entry.timestamp > cutoffTime);
        }
    }

    shouldRecordPricePoint(history, currentTime) {
        if (history.length === 0) {
            return true; // Always record the first point
        }
        
        const lastEntry = history[history.length - 1];
        const timeSinceLastRecord = currentTime - lastEntry.timestamp;
        const intervalMinutes = this.config.recordingIntervals.shortTerm; // Use 30-minute intervals as base
        const intervalMs = intervalMinutes * 60 * 1000;
        
        return timeSinceLastRecord >= intervalMs;
    }

    downsamplePriceHistory(history, hours) {
        if (history.length === 0) return history;
        
        let intervalMinutes;
        
        // Determine appropriate interval based on time range
        if (hours <= 24) {
            intervalMinutes = this.config.recordingIntervals.shortTerm; // 30 minutes for 24h
        } else if (hours <= 48) {
            intervalMinutes = this.config.recordingIntervals.mediumTerm; // 1 hour for 2 days
        } else {
            intervalMinutes = this.config.recordingIntervals.longTerm; // 12 hours for 1 week+
        }
        
        const intervalMs = intervalMinutes * 60 * 1000;
        const downsampledHistory = [];
        let lastIncludedTime = 0;
        
        for (const entry of history) {
            // Always include the first entry
            if (downsampledHistory.length === 0) {
                downsampledHistory.push(entry);
                lastIncludedTime = entry.timestamp;
                continue;
            }
            
            // Include entry if enough time has passed since last included entry
            if (entry.timestamp - lastIncludedTime >= intervalMs) {
                downsampledHistory.push(entry);
                lastIncludedTime = entry.timestamp;
            }
        }
        
        // Always include the last entry to show current state
        const lastEntry = history[history.length - 1];
        if (downsampledHistory.length > 0 && 
            downsampledHistory[downsampledHistory.length - 1].timestamp !== lastEntry.timestamp) {
            downsampledHistory.push(lastEntry);
        }
        
        return downsampledHistory;
    }

    cleanupOldData() {
        // Clean up old price history and expired events
        const cutoffTime = Date.now() - (this.config.historyRetentionDays * 24 * 60 * 60 * 1000);
        
        Object.keys(this.state.priceHistory).forEach(setId => {
            Object.keys(this.state.priceHistory[setId]).forEach(cardName => {
                this.state.priceHistory[setId][cardName] = 
                    this.state.priceHistory[setId][cardName].filter(entry => entry.timestamp > cutoffTime);
            });
        });
    }

    // Public API methods

    recordCardOpened(setId, cardName, isFoil = false) {
        if (!this.state.supplyData[setId] || !this.state.supplyData[setId][cardName]) {
            return;
        }
        
        this.state.supplyData[setId][cardName].totalOpened++;
        this.state.supplyData[setId][cardName].marketSupply++;
    }

    getCardPrice(setId, cardName, isFoil = false) {
        if (!this.state.cardPrices[setId] || !this.state.cardPrices[setId][cardName]) {
            return 0;
        }
        
        const cardData = this.state.cardPrices[setId][cardName];
        return isFoil ? cardData.foilPrice : cardData.currentPrice;
    }

    getPackPrice(setId, quantity = 1) {
        const allSets = window.getAllSets();
        const setData = allSets[setId];
        
        if (!setData) return 0;
        
        let basePrice = setData.isWeekly ? this.config.packPrices.weekly : this.config.packPrices.standard;
        
        // Apply lifecycle pricing for weekly sets
        if (setData.isWeekly && setData.packPriceMultiplier) {
            basePrice *= setData.packPriceMultiplier;
        }
        
        // Apply booster box discount if buying a full box
        if (quantity >= setData.boosterBoxSize) {
            return basePrice * quantity * (1 - this.config.packPrices.boosterBoxDiscount);
        }
        
        return basePrice * quantity;
    }

    getCardTrend(setId, cardName) {
        if (!this.state.cardPrices[setId] || !this.state.cardPrices[setId][cardName]) {
            return { trend: 'stable', change: 0 };
        }
        
        const cardData = this.state.cardPrices[setId][cardName];
        return {
            trend: cardData.trend,
            change: cardData.lastChange
        };
    }

    getPriceHistory(setId, cardName, hours = 24) {
        if (!this.state.priceHistory[setId] || !this.state.priceHistory[setId][cardName]) {
            return [];
        }
        
        const history = this.state.priceHistory[setId][cardName];
        
        // Check if this is a legacy set that should have backfilled historical data
        const allSets = window.getAllSets();
        const setData = allSets[setId];
        const shouldBackfill = setData && !setData.isWeekly; // Only backfill for original non-weekly sets
        
        const now = Date.now();
        
        if (shouldBackfill) {
            // Check if we need to backfill historical data for legacy sets only
            const fiveDaysAgo = now - (120 * 60 * 60 * 1000);
            const hasHistoricalData = history.some(entry => entry.timestamp < fiveDaysAgo);
            
            if (!hasHistoricalData && history.length > 0) {
                // This legacy set needs historical data - use the ORIGINAL base price, not current price
                const cardData = this.state.cardPrices[setId][cardName];
                if (cardData && cardData.basePrice) {
                    const backfilledHistory = this.generateInitialPriceHistory(cardData.basePrice);
                    // Merge backfilled history with existing data, avoiding duplicates
                    const existingTimestamps = new Set(history.map(entry => entry.timestamp));
                    const newBackfillData = backfilledHistory.filter(entry => !existingTimestamps.has(entry.timestamp));
                    this.state.priceHistory[setId][cardName] = [...newBackfillData, ...history].sort((a, b) => a.timestamp - b.timestamp);
                    console.log(`Backfilled historical data for legacy card ${cardName} from ${setData.name} with ${newBackfillData.length} new data points`);
                }
            }
        }
        
        const cutoffTime = now - (hours * 60 * 60 * 1000);
        const filteredHistory = this.state.priceHistory[setId][cardName]
            .filter(entry => entry.timestamp > cutoffTime)
            .sort((a, b) => a.timestamp - b.timestamp);
        
        // Downsample data based on time range for cleaner charts
        return this.downsamplePriceHistory(filteredHistory, hours);
    }

    getChartData(setId, cardName, hours = 24) {
        const history = this.getPriceHistory(setId, cardName, hours);
        
        if (history.length === 0) {
            return {
                labels: [],
                data: [],
                minPrice: 0,
                maxPrice: 0,
                currentPrice: 0,
                change24h: 0,
                changePercent: 0
            };
        }
        
        const currentPrice = this.getCardPrice(setId, cardName, false);
        
        // Ensure the chart shows the most up-to-date current price as the last point
        const chartHistory = [...history];
        const lastEntry = chartHistory[chartHistory.length - 1];
        
        // If the last historical entry is older than 5 minutes, add current price as final point
        const now = Date.now();
        if (!lastEntry || (now - lastEntry.timestamp) > (5 * 60 * 1000)) {
            chartHistory.push({
                timestamp: now,
                price: currentPrice,
                volume: 0
            });
        } else {
            // Update the last entry to show current price
            chartHistory[chartHistory.length - 1] = {
                ...lastEntry,
                price: currentPrice
            };
        }
        
        const startPrice = chartHistory[0].price;
        const change24h = currentPrice - startPrice;
        const changePercent = startPrice > 0 ? (change24h / startPrice) * 100 : 0;
        
        const prices = chartHistory.map(entry => entry.price);
        const minPrice = Math.min(...prices, currentPrice);
        const maxPrice = Math.max(...prices, currentPrice);
        
        return {
            labels: chartHistory.map(entry => new Date(entry.timestamp)),
            data: prices,
            timestamps: chartHistory.map(entry => entry.timestamp),
            minPrice,
            maxPrice,
            currentPrice,
            change24h,
            changePercent,
            dataPoints: chartHistory.length
        };
    }

    getMarketSummary() {
        const totalCards = Object.keys(this.state.cardPrices).reduce((total, setId) => {
            return total + Object.keys(this.state.cardPrices[setId]).length;
        }, 0);
        
        let totalValue = 0;
        let gainers = 0;
        let losers = 0;
        
        Object.keys(this.state.cardPrices).forEach(setId => {
            Object.keys(this.state.cardPrices[setId]).forEach(cardName => {
                const cardData = this.state.cardPrices[setId][cardName];
                totalValue += cardData.currentPrice;
                
                if (cardData.lastChange > 0) gainers++;
                else if (cardData.lastChange < 0) losers++;
            });
        });
        
        return {
            totalCards,
            totalValue: Math.round(totalValue * 100) / 100,
            sentiment: this.state.marketSentiment,
            gainers,
            losers,
            stable: totalCards - gainers - losers,
            activeEvents: this.state.demandEvents.length
        };
    }

    getHotCards(limit = 10) {
        const hotCards = [];
        
        Object.keys(this.state.cardPrices).forEach(setId => {
            Object.keys(this.state.cardPrices[setId]).forEach(cardName => {
                const cardData = this.state.cardPrices[setId][cardName];
                const demandEvent = this.state.demandEvents.find(event => 
                    event.setId === setId && event.cardName === cardName
                );
                
                if (demandEvent || cardData.lastChange > 5) {
                    hotCards.push({
                        setId,
                        cardName,
                        price: cardData.currentPrice,
                        change: cardData.lastChange,
                        trend: cardData.trend,
                        event: demandEvent ? demandEvent.type : null
                    });
                }
            });
        });
        
        return hotCards
            .sort((a, b) => b.change - a.change)
            .slice(0, limit);
    }

    // Save/load state for persistence
    getState() {
        return { ...this.state };
    }

    setState(newState) {
        this.state = { ...newState };
        
        // Restart market systems if they were running
        if (this.priceUpdateTimer) {
            this.startPriceUpdates();
        }
    }
    
    // =============================================================================
    // TRADING MARKET EXTENSIONS
    // =============================================================================
    
    // Wishlist Management
    addToWishlist(setId, cardName, maxPrice = null, isFoil = false, priority = 'medium') {
        const existing = this.state.wishlist.find(item => 
            item.setId === setId && item.cardName === cardName && item.isFoil === isFoil
        );
        
        if (existing) {
            existing.maxPrice = maxPrice;
            existing.priority = priority;
            return { success: true, message: 'Wishlist item updated' };
        }
        
        this.state.wishlist.push({
            setId,
            cardName,
            maxPrice,
            isFoil,
            priority,
            addedAt: Date.now()
        });
        
        this.checkWishlistAvailability(setId, cardName, isFoil);
        return { success: true, message: 'Added to wishlist' };
    }
    
    removeFromWishlist(setId, cardName, isFoil = false) {
        this.ensureMarketState();
        
        const index = this.state.wishlist.findIndex(item => 
            item.setId === setId && item.cardName === cardName && item.isFoil === isFoil
        );
        
        if (index !== -1) {
            this.state.wishlist.splice(index, 1);
            return { success: true, message: 'Removed from wishlist' };
        }
        
        return { success: false, message: 'Item not found in wishlist' };
    }
    
    getWishlist() {
        // Ensure complete market state exists
        this.ensureMarketState();
        
        return this.state.wishlist.map(item => ({
            ...item,
            currentPrice: this.getCardPrice(item.setId, item.cardName, item.isFoil),
            isAvailable: this.isCardAvailableForPurchase(item.setId, item.cardName, item.isFoil),
            bestPrice: this.getBestListingPrice(item.setId, item.cardName, item.isFoil)
        }));
    }
    
    // Market Listings Management
    initializeMarketListings() {
        const allSets = window.getAllSets();
        
        Object.keys(allSets).forEach(setId => {
            // Always ensure the set has a market listings structure
            if (!this.state.marketListings[setId]) {
                this.state.marketListings[setId] = {};
            }
            
            const setData = allSets[setId];
            if (!setData || !setData.cards) {
                console.warn(`Set ${setId} has invalid structure during market initialization, skipping card generation`);
                return; // Skip generating listings for this set, but structure is still created above
            }
            
            Object.keys(setData.cards).forEach(rarity => {
                const cardsInRarity = setData.cards[rarity];
                if (!Array.isArray(cardsInRarity)) {
                    console.warn(`Set ${setId} rarity ${rarity} is not an array during market initialization, skipping`);
                    return;
                }
                
                cardsInRarity.forEach(cardName => {
                    this.generateListingsForCard(setId, cardName, rarity);
                });
            });
        });
    }
    
    generateListingsForCard(setId, cardName, rarity) {
        // Ensure structure exists
        this.ensureMarketStructure(setId, cardName);
        
        const currentListings = this.state.marketListings[setId][cardName];
        const maxListings = this.config.maxListingsPerCard;
        
        // Remove expired listings
        const now = Date.now();
        this.state.marketListings[setId][cardName] = currentListings.filter(listing => 
            (now - listing.listedAt) < listing.duration
        );
        
        // Generate new listings if below max
        const remainingSlots = maxListings - this.state.marketListings[setId][cardName].length;
        
        for (let i = 0; i < remainingSlots; i++) {
            const probability = this.getListingProbability(rarity);
            if (Math.random() < probability) {
                this.createListing(setId, cardName, rarity);
            }
        }
    }
    
    createListing(setId, cardName, rarity) {
        const basePrice = this.getCardPrice(setId, cardName, false);
        const trader = this.getRandomTrader();
        const isFoil = Math.random() < 0.15; // 15% chance for foil listings
        
        // Calculate listing price based on trader type and market conditions
        const priceVariance = (Math.random() - 0.5) * this.config.priceVariance * 2;
        const traderMultiplier = trader.priceMultiplier;
        const marketPrice = isFoil ? basePrice * 3 : basePrice;
        const listingPrice = Math.max(0.01, marketPrice * traderMultiplier * (1 + priceVariance));
        
        const listing = {
            price: Math.round(listingPrice * 100) / 100,
            quantity: this.getListingQuantity(rarity, trader.type),
            isFoil,
            sellerId: this.generateSellerId(trader.type),
            sellerType: trader.type,
            listedAt: Date.now(),
            duration: trader.holdTime * 24 * 60 * 60 * 1000, // Convert days to ms
            views: 0
        };
        
        this.state.marketListings[setId][cardName].push(listing);
        this.recordMarketActivity('list', setId, cardName, listing.price, listing.quantity, listing.isFoil);
    }
    
    getListingQuantity(rarity, traderType) {
        const baseQuantities = {
            common: { min: 4, max: 20 },
            uncommon: { min: 2, max: 8 },
            rare: { min: 1, max: 4 },
            mythic: { min: 1, max: 2 }
        };
        
        const range = baseQuantities[rarity] || baseQuantities.rare;
        let quantity = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        
        // Adjust based on trader type
        if (traderType === 'whale') quantity = Math.max(1, Math.floor(quantity * 0.5));
        if (traderType === 'casual') quantity = Math.ceil(quantity * 1.5);
        
        return quantity;
    }
    
    getRandomTrader() {
        const weights = this.config.traderTypes.map(t => t.listingChance);
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < this.config.traderTypes.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return this.config.traderTypes[i];
            }
        }
        
        return this.config.traderTypes[0]; // Fallback
    }
    
    generateSellerId(traderType) {
        const prefixes = {
            casual: ['Player', 'Trader', 'Gamer'],
            flipper: ['QuickFlip', 'FastTrade', 'Market'],
            collector: ['Collector', 'Vintage', 'Archive'],
            whale: ['BigSpender', 'HighRoller', 'Premium']
        };
        
        const prefix = prefixes[traderType][Math.floor(Math.random() * prefixes[traderType].length)];
        const number = Math.floor(Math.random() * 9999) + 1;
        return `${prefix}${number}`;
    }
    
    getListingProbability(rarity) {
        const probabilities = {
            common: 0.8,
            uncommon: 0.6,
            rare: 0.3,
            mythic: 0.1
        };
        return probabilities[rarity] || 0.3;
    }
    
    // Purchase System
    purchaseCard(setId, cardName, isFoil, listingIndex) {
        const listings = this.getAvailableListings(setId, cardName, isFoil);
        
        if (!listings || listingIndex >= listings.length) {
            return { success: false, message: 'Listing not available' };
        }
        
        const listing = listings[listingIndex];
        const cost = listing.price * listing.quantity;
        
        // This will be called from GameEngine, so we need to access the game state
        if (window.gameEngine && window.gameEngine.state.wallet < cost) {
            return { success: false, message: 'Insufficient funds' };
        }
        
        // Remove listing first to prevent double purchase
        const originalListings = this.state.marketListings[setId][cardName];
        const actualIndex = originalListings.indexOf(listing);
        if (actualIndex !== -1) {
            originalListings.splice(actualIndex, 1);
        }
        
        // Record activity
        this.recordMarketActivity('buy', setId, cardName, listing.price, listing.quantity, isFoil);
        
        // Check if this satisfies any wishlist items
        this.checkWishlistFulfillment(setId, cardName, isFoil);
        
        return { 
            success: true, 
            message: `Purchased ${listing.quantity}x ${cardName} for $${cost.toFixed(2)}`,
            cost,
            quantity: listing.quantity,
            isFoil: listing.isFoil
        };
    }
    
    // Utility method to ensure complete market state exists
    ensureMarketState() {
        if (!this.state) {
            console.warn('Market engine state is undefined, reinitializing complete state...');
            this.state = {
                cardPrices: {},
                marketSentiment: 1.0,
                priceHistory: {},
                supplyData: {},
                demandEvents: [],
                lastPriceUpdate: Date.now(),
                totalMarketValue: 0,
                wishlist: [],
                marketListings: {},
                marketActivity: [],
                aiTraders: []
            };
        }
        
        // Ensure all required state properties exist
        if (!this.state.marketListings) this.state.marketListings = {};
        if (!this.state.wishlist) this.state.wishlist = [];
        if (!this.state.marketActivity) this.state.marketActivity = [];
        if (!this.state.cardPrices) this.state.cardPrices = {};
        if (!this.state.priceHistory) this.state.priceHistory = {};
        if (!this.state.supplyData) this.state.supplyData = {};
        if (!this.state.demandEvents) this.state.demandEvents = [];
        if (!this.state.aiTraders) this.state.aiTraders = [];
        
        return true;
    }

    // Utility method to ensure market structure exists
    ensureMarketStructure(setId, cardName = null) {
        // First ensure complete state
        this.ensureMarketState();
        
        if (!this.state.marketListings[setId]) {
            this.state.marketListings[setId] = {};
        }
        
        if (cardName && !this.state.marketListings[setId][cardName]) {
            this.state.marketListings[setId][cardName] = [];
        }
        
        return true;
    }
    
    // Market Data and Queries
    getAvailableListings(setId, cardName, isFoil = null) {
        // Ensure structure exists before accessing
        if (!this.ensureMarketStructure(setId, cardName)) {
            return [];
        }
        
        return this.state.marketListings[setId][cardName]
            .filter(listing => isFoil === null || listing.isFoil === isFoil)
            .sort((a, b) => a.price - b.price); // Sort by price, cheapest first
    }
    
    getBestListingPrice(setId, cardName, isFoil = false) {
        const listings = this.getAvailableListings(setId, cardName, isFoil);
        return listings.length > 0 ? listings[0].price : null;
    }
    
    isCardAvailableForPurchase(setId, cardName, isFoil = false) {
        return this.getAvailableListings(setId, cardName, isFoil).length > 0;
    }
    
    getMarketDepth(setId, cardName) {
        const regularListings = this.getAvailableListings(setId, cardName, false);
        const foilListings = this.getAvailableListings(setId, cardName, true);
        
        return {
            regular: {
                listings: regularListings.length,
                totalQuantity: regularListings.reduce((sum, l) => sum + l.quantity, 0),
                priceRange: regularListings.length > 0 ? {
                    min: regularListings[0].price,
                    max: regularListings[regularListings.length - 1].price
                } : null
            },
            foil: {
                listings: foilListings.length,
                totalQuantity: foilListings.reduce((sum, l) => sum + l.quantity, 0),
                priceRange: foilListings.length > 0 ? {
                    min: foilListings[0].price,
                    max: foilListings[foilListings.length - 1].price
                } : null
            }
        };
    }
    
    // Market Activity and Events
    recordMarketActivity(type, setId, cardName, price, quantity, isFoil) {
        this.ensureMarketState();
        
        this.state.marketActivity.unshift({
            type, // 'list', 'buy', 'expire'
            setId,
            cardName,
            price,
            quantity,
            isFoil,
            timestamp: Date.now()
        });
        
        // Keep only recent activity (last 100 events)
        this.state.marketActivity = this.state.marketActivity.slice(0, 100);
    }
    
    getRecentMarketActivity(limit = 20) {
        this.ensureMarketState();
        return this.state.marketActivity.slice(0, limit);
    }
    
    checkWishlistAvailability(setId, cardName, isFoil) {
        const wishlistItem = this.state.wishlist.find(item => 
            item.setId === setId && item.cardName === cardName && item.isFoil === isFoil
        );
        
        if (!wishlistItem) return;
        
        const bestPrice = this.getBestListingPrice(setId, cardName, isFoil);
        if (bestPrice && (!wishlistItem.maxPrice || bestPrice <= wishlistItem.maxPrice * this.config.wishlistNotificationThreshold)) {
            this.triggerWishlistNotification(wishlistItem, bestPrice);
        }
    }
    
    checkWishlistFulfillment(setId, cardName, isFoil) {
        const index = this.state.wishlist.findIndex(item => 
            item.setId === setId && item.cardName === cardName && item.isFoil === isFoil
        );
        
        if (index !== -1) {
            const item = this.state.wishlist[index];
            this.state.wishlist.splice(index, 1);
            return { fulfilled: true, item };
        }
        
        return { fulfilled: false };
    }
    
    triggerWishlistNotification(wishlistItem, currentPrice) {
        // Trigger UI notification
        if (window.uiManager && window.uiManager.showNotification) {
            const message = `💫 ${wishlistItem.cardName} is available for $${currentPrice.toFixed(2)}!`;
            window.uiManager.showNotification(message, 'info', 5000);
        }
    }
    
    // Market Simulation Updates
    updateMarketListings() {
        const allSets = window.getAllSets();
        
        Object.keys(allSets).forEach(setId => {
            const setData = allSets[setId];
            if (!setData || !setData.cards) {
                console.warn(`Set ${setId} has invalid structure during market update, skipping`);
                return;
            }
            
            Object.keys(setData.cards).forEach(rarity => {
                const cardsInRarity = setData.cards[rarity];
                if (!Array.isArray(cardsInRarity)) {
                    console.warn(`Set ${setId} rarity ${rarity} is not an array during market update, skipping`);
                    return;
                }
                
                cardsInRarity.forEach(cardName => {
                    this.generateListingsForCard(setId, cardName, rarity);
                });
            });
        });
        
        // Check all wishlist items for new availability
        this.state.wishlist.forEach(item => {
            this.checkWishlistAvailability(item.setId, item.cardName, item.isFoil);
        });
        
        // Simulate some AI purchases
        this.simulateAIPurchases();
    }
    
    simulateAIPurchases() {
        const allListings = [];
        
        Object.keys(this.state.marketListings).forEach(setId => {
            Object.keys(this.state.marketListings[setId]).forEach(cardName => {
                this.state.marketListings[setId][cardName].forEach((listing, index) => {
                    allListings.push({ setId, cardName, listing, listingArray: this.state.marketListings[setId][cardName], index });
                });
            });
        });
        
        // Simulate some purchases (remove 1-3% of listings randomly)
        const purchaseCount = Math.floor(allListings.length * (Math.random() * 0.02 + 0.01));
        
        for (let i = 0; i < purchaseCount && allListings.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * allListings.length);
            const { setId, cardName, listing, listingArray, index } = allListings[randomIndex];
            
            // Remove the listing
            listingArray.splice(index, 1);
            this.recordMarketActivity('buy', setId, cardName, listing.price, listing.quantity, listing.isFoil);
            
            // Remove from our local array
            allListings.splice(randomIndex, 1);
            
            // Update indices for remaining listings from the same array
            allListings.forEach(item => {
                if (item.listingArray === listingArray && item.index > index) {
                    item.index--;
                }
            });
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MarketEngine };
} else {
    window.MarketEngine = MarketEngine;
}
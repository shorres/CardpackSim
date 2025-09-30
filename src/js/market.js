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
            totalMarketValue: 0
        };
        
        this.config = {
            // Pack pricing
            packPrices: {
                standard: 10.00,
                weekly: 13.00,
                boosterBoxDiscount: 0.04 // 4% discount for boxes
            },
            
            // Base price ranges by rarity
            basePriceRanges: {
                common: { min: 0.10, max: 0.50 },
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
            priceUpdateInterval: 45000, // 45 seconds
            historyRetentionDays: 7, // Keep 7 days for charts
            chartDataPoints: 200 // Max data points for charts
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
        
        // Start price update cycle
        this.startPriceUpdates();
    }

    initializeSetPrices(setId, setData) {
        if (!this.state.cardPrices[setId]) {
            this.state.cardPrices[setId] = {};
            this.state.priceHistory[setId] = {};
            this.state.supplyData[setId] = {};
        }

        const setMultiplier = setData.isWeekly ? this.config.setMultipliers.weekly : this.config.setMultipliers.standard;
        
        // Initialize prices for each rarity
        Object.keys(setData.cards).forEach(rarity => {
            setData.cards[rarity].forEach(cardName => {
                if (!this.state.cardPrices[setId][cardName]) {
                    const basePrice = this.generateBasePrice(rarity, setMultiplier);
                    
                    this.state.cardPrices[setId][cardName] = {
                        currentPrice: basePrice,
                        basePrice: basePrice,
                        foilPrice: basePrice * this.generateFoilMultiplier(),
                        lastChange: 0,
                        trend: 'stable' // 'rising', 'falling', 'stable'
                    };
                    
                    this.state.priceHistory[setId][cardName] = [{
                        timestamp: Date.now(),
                        price: basePrice,
                        volume: 0
                    }];
                    
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
        
        // For more detailed charts, record every price update
        history.push({
            timestamp: now,
            price: price,
            volume: 0 // We'll track this when implementing actual trading
        });
        
        // Keep detailed history but limit points for performance
        if (history.length > this.config.chartDataPoints) {
            // Remove oldest entries but keep some for longer-term trends
            const keepEveryN = Math.ceil(history.length / this.config.chartDataPoints);
            this.state.priceHistory[setId][cardName] = history.filter((_, index) => 
                index === history.length - 1 || index % keepEveryN === 0
            );
        }
        
        // Keep only recent history for charts
        const cutoffTime = now - (this.config.historyRetentionDays * 24 * 60 * 60 * 1000);
        this.state.priceHistory[setId][cardName] = 
            this.state.priceHistory[setId][cardName].filter(entry => entry.timestamp > cutoffTime);
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
        
        const basePrice = setData.isWeekly ? this.config.packPrices.weekly : this.config.packPrices.standard;
        
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
        
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
        return this.state.priceHistory[setId][cardName]
            .filter(entry => entry.timestamp > cutoffTime)
            .sort((a, b) => a.timestamp - b.timestamp);
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
        const startPrice = history[0].price;
        const change24h = currentPrice - startPrice;
        const changePercent = startPrice > 0 ? (change24h / startPrice) * 100 : 0;
        
        const prices = history.map(entry => entry.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        return {
            labels: history.map(entry => new Date(entry.timestamp)),
            data: prices,
            timestamps: history.map(entry => entry.timestamp),
            minPrice,
            maxPrice,
            currentPrice,
            change24h,
            changePercent,
            dataPoints: history.length
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
        this.startPriceUpdates();
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
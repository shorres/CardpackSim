// Local Storage Management
class StorageManager {
    constructor() {
        this.storageKey = 'tcgSimState';
        this.marketStorageKey = 'tcgSimMarketState';
    }

    saveState(state) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save state to localStorage:', error);
        }
    }

    loadState() {
        try {
            const savedState = localStorage.getItem(this.storageKey);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                
                // Ensure all sets are represented in the state
                const allSets = window.getAllSets ? window.getAllSets() : (window.TCG_SETS || {});
                Object.keys(allSets).forEach(setId => {
                    if (!parsedState.unopenedPacks || typeof parsedState.unopenedPacks[setId] === 'undefined') {
                        if (!parsedState.unopenedPacks) parsedState.unopenedPacks = {};
                        parsedState.unopenedPacks[setId] = 0;
                    }
                    if (!parsedState.collection || !parsedState.collection[setId]) {
                        if (!parsedState.collection) parsedState.collection = {};
                        parsedState.collection[setId] = {};
                    }
                });
                
                return parsedState;
            }
        } catch (error) {
            console.error("Could not load state from localStorage:", error);
        }
        
        return null;
    }

    clearState() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.marketStorageKey);
        } catch (error) {
            console.error('Failed to clear state from localStorage:', error);
        }
    }

    saveMarketState(marketState) {
        try {
            localStorage.setItem(this.marketStorageKey, JSON.stringify(marketState));
        } catch (error) {
            console.error('Failed to save market state to localStorage:', error);
        }
    }

    loadMarketState() {
        try {
            const savedState = localStorage.getItem(this.marketStorageKey);
            if (savedState) {
                return JSON.parse(savedState);
            }
        } catch (error) {
            console.error("Could not load market state from localStorage:", error);
        }
        
        return null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager };
} else {
    window.StorageManager = StorageManager;
}
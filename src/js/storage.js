// Local Storage Management
class StorageManager {
    constructor() {
        this.storageKey = 'tcgSimState';
        this.marketStorageKey = 'tcgSimMarketState';
        this.weeklySetsKey = 'tcgSimWeeklySets';
    }

    saveState(state) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save state to localStorage:', error);
        }
    }

    saveWeeklySet(setId, setData) {
        try {
            const existingSets = this.loadWeeklySets();
            
            // Add lifecycle information when storing
            const enrichedSetData = {
                ...setData,
                storedDate: Date.now(),
                lifecycle: 'featured', // Start as featured
                featuredUntil: Date.now() + (7 * 24 * 60 * 60 * 1000), // 1 week
                standardUntil: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
                rotateDate: Date.now() + (30 * 24 * 60 * 60 * 1000) // Rotate to legacy after 30 days
            };
            
            existingSets[setId] = enrichedSetData;
            localStorage.setItem(this.weeklySetsKey, JSON.stringify(existingSets));
            console.log(`Stored weekly set: ${setId}`);
        } catch (error) {
            console.error('Failed to save weekly set to localStorage:', error);
        }
    }

    loadWeeklySets() {
        try {
            const savedSets = localStorage.getItem(this.weeklySetsKey);
            return savedSets ? JSON.parse(savedSets) : {};
        } catch (error) {
            console.error('Failed to load weekly sets from localStorage:', error);
            return {};
        }
    }

    updateSetLifecycle(setId, newLifecycle) {
        try {
            const existingSets = this.loadWeeklySets();
            if (existingSets[setId]) {
                existingSets[setId].lifecycle = newLifecycle;
                localStorage.setItem(this.weeklySetsKey, JSON.stringify(existingSets));
            }
        } catch (error) {
            console.error('Failed to update set lifecycle:', error);
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
                
                // Clean up obsolete sets (e.g., old weekly sets that are no longer active)
                if (parsedState.unopenedPacks) {
                    Object.keys(parsedState.unopenedPacks).forEach(setId => {
                        if (!allSets[setId]) {
                            console.log(`Removing obsolete set ${setId} from state`);
                            delete parsedState.unopenedPacks[setId];
                        }
                    });
                }
                
                if (parsedState.collection) {
                    Object.keys(parsedState.collection).forEach(setId => {
                        if (!allSets[setId]) {
                            console.log(`Removing obsolete set ${setId} collection from state`);
                            delete parsedState.collection[setId];
                        }
                    });
                }
                
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
            localStorage.removeItem(this.weeklySetsKey);
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
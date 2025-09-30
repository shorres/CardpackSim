// Local Storage Management
class StorageManager {
    constructor() {
        this.storageKey = 'tcgSimState';
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
                Object.keys(window.TCG_SETS || {}).forEach(setId => {
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
        } catch (error) {
            console.error('Failed to clear state from localStorage:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager };
} else {
    window.StorageManager = StorageManager;
}
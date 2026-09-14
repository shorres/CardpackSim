// Main Application Entry Point
class TCGPackSimulator {
    constructor() {
        this.gameEngine = null;
        this.uiManager = null;
    }

    async initialize() {
        // Read the save document off disk first. Everything downstream (GameEngine,
        // getAllSets, MarketEngine) reads it synchronously from memory.
        const loadResult = await StorageManager.initialize();
        console.log('Save loaded:', loadResult);

        // Initialize the game engine (which includes market engine)
        this.gameEngine = new GameEngine();
        
        // Load saved market state if available
        const savedMarketState = this.gameEngine.storageManager.loadMarketState();
        if (savedMarketState) {
            this.gameEngine.marketEngine.setState(savedMarketState);
        }

        // Drop old weekly sets the player holds no cards from, so the set list (and every
        // price/listing structure keyed off it) stops growing by one set per week forever.
        // Pruning the definition alone used to leave the set's prices, history, supply and
        // listings in the save permanently -- and those are the bulk of it.
        const prunedSets = this.gameEngine.storageManager.pruneWeeklySets(this.gameEngine.state.collection);
        prunedSets.forEach(setId => this.gameEngine.marketEngine.purgeSet(setId));
        
        // Initialize the UI manager
        this.uiManager = new UIManager(this.gameEngine);
        
        // Make UI manager and game engine globally available
        window.gameEngine = this.gameEngine;
        window.uiManager = this.uiManager;
        
        // Destructive debug helpers: dev builds only. Players get proper corrupt-save
        // recovery via the backup file, and File > New Game for a deliberate reset.
        if (window.electronAPI?.isDev) {
            window.emergencyReset = () => this.emergencyReset();
            window.clearAllData = () => this.clearAllData();
        }
        
        // Route save failures to the existing toast system instead of console-only.
        StorageManager.setErrorHandler((message, type) => {
            this.uiManager.showNotification(message, type || 'error');
        });

        // Initial render
        this.uiManager.refreshUI();

        if (loadResult && loadResult.warning) {
            this.uiManager.showNotification(loadResult.warning, 'error');
        }
        if (loadResult && loadResult.error) {
            this.uiManager.showNotification('Could not read your save: ' + loadResult.error, 'error');
        }
        
        // Set up conservative cache management for glyph art optimization
        this.setupPerformanceOptimizations();
        
        // Set up Electron IPC listeners for new game functionality
        this.setupElectronListeners();
    }

    reset() {
        this.gameEngine.resetGame();
        // Market engine is reset as part of game reset, no need to recreate
        this.uiManager.refreshUI();
    }

    setupPerformanceOptimizations() {
        // The glyph-art cache holds small deterministic HTML strings keyed on card+rarity,
        // so it is cheap to keep and is what makes collection re-renders fast. It used to be
        // trimmed to 50 entries on every tab switch, which guaranteed thrashing for a
        // 128-card set; just trim to its own bound periodically.
        if (window.glyphArtGenerator) {
            setInterval(() => {
                window.glyphArtGenerator.manageCacheSize();
            }, 120000);
        }
    }

    setupElectronListeners() {
        // Check if we're running in Electron
        if (window.electronAPI) {
            // Listen for new game requests from the main process
            window.electronAPI.onNewGameRequest(() => {
                this.showNewGameConfirmation();
            });
            
            // Listen for confirmed game reset
            window.electronAPI.onResetGame(() => {
                this.reset();
            });
        }
    }

    showNewGameConfirmation() {
        // Create a modal confirmation dialog
        const modal = document.createElement('div');
        modal.className = 'reset-confirmation-modal';
        modal.innerHTML = `
            <div class="reset-confirmation-content">
                <h3>Start New Game</h3>
                <p>Are you sure you want to start a new game?</p>
                <p><strong>This will permanently delete all your progress:</strong></p>
                <ul>
                    <li>Card collection</li>
                    <li>Unopened packs</li>
                    <li>Wallet and earnings</li>
                    <li>Market data</li>
                    <li>Achievements and titles</li>
                </ul>
                <p><em>This action cannot be undone.</em></p>
                <div class="reset-confirmation-buttons">
                    <button id="confirm-reset" class="btn btn-danger">Start New Game</button>
                    <button id="cancel-reset" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const confirmBtn = modal.querySelector('#confirm-reset');
        const cancelBtn = modal.querySelector('#cancel-reset');
        
        confirmBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            if (window.electronAPI) {
                window.electronAPI.newGameConfirmed();
            }
            // Also reset immediately
            this.reset();
        });
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            if (window.electronAPI) {
                window.electronAPI.newGameCancelled();
            }
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                if (window.electronAPI) {
                    window.electronAPI.newGameCancelled();
                }
            }
        });
        
        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                if (window.electronAPI) {
                    window.electronAPI.newGameCancelled();
                }
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        document.body.appendChild(modal);
    }

    // Emergency reset methods
    emergencyReset() {
        try {
            console.log('🚨 EMERGENCY RESET - Clearing corrupted save data...');
            
            // Clear all save data
            if (this.gameEngine?.storageManager?.clearAllData()) {
                console.log('✅ Save data cleared successfully');
                
                // Force page reload to start fresh
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
                return 'Save data cleared. Page will reload in 1 second...';
            } else {
                return 'Failed to clear save data. Try manual localStorage clear.';
            }
        } catch (error) {
            console.error('Emergency reset failed:', error);
            return 'Emergency reset failed. Try: localStorage.clear() in console.';
        }
    }

    clearAllData() {
        try {
            console.log('🗑️ CLEARING ALL DATA...');
            
            // Clear localStorage completely
            localStorage.clear();
            console.log('✅ All localStorage cleared');
            
            // Force page reload
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
            return 'All data cleared. Page will reload in 1 second...';
        } catch (error) {
            console.error('Clear all data failed:', error);
            return 'Failed to clear data.';
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tcgApp = new TCGPackSimulator();
    window.tcgApp.initialize().catch((error) => {
        console.error('Startup failed:', error);
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TCGPackSimulator };
} else {
    window.TCGPackSimulator = TCGPackSimulator;
}
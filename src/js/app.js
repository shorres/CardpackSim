// Main Application Entry Point
class TCGPackSimulator {
    constructor() {
        this.gameEngine = null;
        this.uiManager = null;
        this.updater = null;
    }

    initialize() {
        // Initialize the game engine (which includes market engine)
        this.gameEngine = new GameEngine();
        
        // Load saved market state if available
        const savedMarketState = this.gameEngine.storageManager.loadMarketState();
        if (savedMarketState) {
            this.gameEngine.marketEngine.setState(savedMarketState);
        }
        
        // Initialize the UI manager
        this.uiManager = new UIManager(this.gameEngine);
        
        // Make UI manager and game engine globally available
        window.gameEngine = this.gameEngine;
        window.uiManager = this.uiManager;
        
        // Expose emergency reset functions globally
        window.emergencyReset = () => this.emergencyReset();
        window.clearAllData = () => this.clearAllData();
        
        // Initial render
        this.uiManager.refreshUI();
        
        // Set up conservative cache management for glyph art optimization
        this.setupPerformanceOptimizations();
        
        // Set up Electron IPC listeners for new game functionality
        this.setupElectronListeners();
        
        // Initialize simple update checker
        this.setupSimpleUpdater();
    }

    reset() {
        this.gameEngine.resetGame();
        // Market engine is reset as part of game reset, no need to recreate
        this.uiManager.refreshUI();
    }

    setupPerformanceOptimizations() {
        // Conservative cache management for collection views only
        if (window.glyphArtGenerator) {
            // Clear cache on tab changes to prevent memory buildup
            const originalMethod = this.uiManager.switchTab;
            if (originalMethod) {
                this.uiManager.switchTab = (tabName) => {
                    if (tabName !== 'collection') {
                        window.glyphArtGenerator.clearPerformanceCache();
                    }
                    return originalMethod.call(this.uiManager, tabName);
                };
            }
            
            // Clean up cache on page unload
            window.addEventListener('beforeunload', () => {
                window.glyphArtGenerator.clearPerformanceCache();
            });
            
            // Conservative memory management - clean every 2 minutes
            setInterval(() => {
                if (window.glyphArtGenerator.getCacheStats().imageCache > 30) {
                    window.glyphArtGenerator.manageCacheSize(30);
                }
            }, 120000); // 2 minutes
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

    setupSimpleUpdater() {
        // Initialize simple update checker if available
        if (window.SimpleUpdater) {
            this.updater = new SimpleUpdater();
            this.updater.initialize();
            
            // Make it globally available for debugging
            window.simpleUpdater = this.updater;
            
            // Add debug commands for testing
            if (typeof window !== 'undefined') {
                window.checkForUpdates = () => this.updater.manualCheck();
                window.resetDismissedUpdates = () => this.updater.resetDismissed();
                window.getUpdaterStatus = () => this.updater.getStatus();
            }
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
    window.tcgApp.initialize();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TCGPackSimulator };
} else {
    window.TCGPackSimulator = TCGPackSimulator;
}
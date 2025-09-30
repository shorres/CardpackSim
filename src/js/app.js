// Main Application Entry Point
class TCGPackSimulator {
    constructor() {
        this.gameEngine = null;
        this.uiManager = null;
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
        
        // Initial render
        this.uiManager.refreshUI();
        
        console.log('TCG Pack Simulator with Market System initialized successfully!');
    }

    reset() {
        this.gameEngine.resetGame();
        this.gameEngine.marketEngine.destroy();
        this.gameEngine.marketEngine = new MarketEngine();
        this.uiManager.refreshUI();
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
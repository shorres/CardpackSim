// Main Application Entry Point
class TCGPackSimulator {
    constructor() {
        this.gameEngine = null;
        this.uiManager = null;
    }

    initialize() {
        // Initialize the game engine
        this.gameEngine = new GameEngine();
        
        // Initialize the UI manager
        this.uiManager = new UIManager(this.gameEngine);
        
        // Initial render
        this.uiManager.refreshUI();
        
        console.log('TCG Pack Simulator initialized successfully!');
    }

    reset() {
        this.gameEngine.resetGame();
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